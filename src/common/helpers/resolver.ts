/**
 * AccountResolver is responsible for resolving account names and retrieving account information.
 * It provides utility methods to look up account names based on the address and tag,
 * as well as methods to fetch detailed account information including risk level and settings.
 */

import { has, get, assign } from 'lodash';

import AccountRepository from '@store/repositories/account';
import ContactRepository from '@store/repositories/contact';

import LedgerService from '@services/LedgerService';
import BackendService from '@services/BackendService';

import Amount from '@common/libs/ledger/parser/common/amount';

import LRUCache from '@common/utils/cache';
import LoggerService, { LoggerInstance } from '@services/LoggerService';

/* Types ==================================================================== */
export interface PayIDInfo {
    account: string;
    tag: string | null;
}

export interface AccountNameType {
    address: string;
    tag?: number;
    name?: string;
    source?: string;
    kycApproved?: boolean;
}

export interface AccountInfoType {
    exist: boolean;
    risk: 'ERROR' | 'UNKNOWN' | 'PROBABLE' | 'HIGH_PROBABILITY' | 'CONFIRMED';
    requireDestinationTag: boolean;
    possibleExchange: boolean;
    disallowIncomingXRP: boolean;
    blackHole: boolean;
}

/* Resolver ==================================================================== */
class AccountResolver {
    private static CacheSize = 300;
    private cache: LRUCache<string, Promise<AccountNameType> | AccountNameType>;
    private logger: LoggerInstance;

    constructor() {
        this.cache = new LRUCache<string, Promise<AccountNameType> | AccountNameType>(AccountResolver.CacheSize);
        this.logger = LoggerService.createLogger('AccountResolver');
    }

    private lookupresolveAccountName = async (
        address: string,
        tag?: number,
        internal = false,
    ): Promise<AccountNameType> => {
        const notFound: AccountNameType = {
            address,
            tag,
            name: '',
            source: '',
        };

        if (!address) {
            return notFound;
        }

        // Check in address book
        try {
            const contact = await ContactRepository.findOne({
                address,
                destinationTag: `${tag ?? ''}`,
            });

            if (contact) {
                return {
                    address,
                    tag,
                    name: contact.name,
                    source: 'contacts',
                };
            }
        } catch (error) {
            this.logger.error('fetching contact:', error);
        }

        // Check in accounts list
        try {
            const account = await AccountRepository.findOne({ address });
            if (account) {
                return {
                    address,
                    tag,
                    name: account.label,
                    source: 'accounts',
                };
            }
        } catch (error) {
            this.logger.error('fetching account:', error);
        }

        // Only lookup for local results
        if (internal) {
            return notFound;
        }

        // Check the backend
        try {
            const res = await BackendService.getAddressInfo(address);
            if (res) {
                return {
                    address,
                    tag,
                    name: res.name ?? undefined,
                    source: res.source?.replace('internal:', '').replace('.com', ''),
                    kycApproved: res.kycApproved,
                };
            }
        } catch (error) {
            this.logger.error('fetching info from API', error);
        }

        return notFound;
    };

    public setCache = (key: string, value: AccountNameType | Promise<AccountNameType>) => {
        this.cache.set(key, value);
    };

    public getAccountName = async (address: string, tag?: number, internal = false): Promise<AccountNameType> => {
        if (!address) {
            throw new Error('Address is required.');
        }

        const key = `${address}${tag ?? ''}`;

        const cachedValue = this.cache.get(key);
        if (cachedValue) {
            return cachedValue;
        }

        const resultPromise = (async () => {
            const result = await this.lookupresolveAccountName(address, tag, internal);
            this.cache.set(key, result);
            return result;
        })();

        this.cache.set(key, resultPromise); // save the promise itself for subsequent calls

        return resultPromise;
    };

    getAccountInfo = async (address: string): Promise<AccountInfoType> => {
        if (!address) {
            throw new Error('Address is required.');
        }

        const info: AccountInfoType = {
            exist: true,
            risk: 'UNKNOWN',
            requireDestinationTag: false,
            possibleExchange: false,
            disallowIncomingXRP: false,
            blackHole: false,
        };

        // get account risk level
        const accountAdvisory = await BackendService.getAccountAdvisory(address);

        if (has(accountAdvisory, 'danger')) {
            assign(info, { risk: accountAdvisory.danger });
        } else {
            this.logger.error('account advisory risk level not found.');
            throw new Error('Account advisory risk level not found.');
        }

        const accountInfo = await LedgerService.getAccountInfo(address);

        // account doesn't exist, no need to check account risk
        if ('error' in accountInfo) {
            if (get(accountInfo, 'error') === 'actNotFound') {
                assign(info, { exist: false });
                return info;
            }
            this.logger.error('fetching account info:', accountInfo);
            throw new Error('Error fetching account info.');
        }

        const { account_data, account_flags } = accountInfo;

        // if balance is more than 1m possibly exchange account
        if (has(account_data, ['Balance'])) {
            if (new Amount(account_data.Balance, true).dropsToNative().toNumber() > 1000000) {
                assign(info, { possibleExchange: true });
            }
        }

        // check for black hole
        if (has(account_data, ['RegularKey'])) {
            if (
                account_flags?.disableMasterKey &&
                ['rrrrrrrrrrrrrrrrrrrrrhoLvTp', 'rrrrrrrrrrrrrrrrrrrrBZbvji'].indexOf(account_data.RegularKey ?? '') >
                    -1
            ) {
                assign(info, { blackHole: true });
            }
        }

        // check for disallow incoming XRP
        if (account_flags?.disallowIncomingXRP) {
            assign(info, { disallowIncomingXRP: true });
        }

        if (get(accountAdvisory, 'force_dtag')) {
            // first check on account advisory
            assign(info, { requireDestinationTag: true, possibleExchange: true });
        } else if (account_flags?.requireDestinationTag) {
            // check if account have the required destination tag flag set
            assign(info, { requireDestinationTag: true, possibleExchange: true });
        } else {
            // scan the most recent transactions of the account for the destination tags
            const transactionsResp = await LedgerService.getTransactions(address, undefined, 200);
            if (
                !('error' in transactionsResp) &&
                transactionsResp.transactions &&
                transactionsResp.transactions.length > 0
            ) {
                const incomingTXS = transactionsResp.transactions.filter((tx) => tx.tx.Destination === address);

                const incomingTxCountWithTag = incomingTXS.filter(
                    (tx) =>
                        typeof tx.tx.TransactionType === 'string' &&
                        typeof tx.tx.DestinationTag !== 'undefined' &&
                        Number(tx.tx.DestinationTag) > 9999,
                ).length;

                const senders = transactionsResp.transactions.map((tx) => tx.tx.Account || '');

                const uniqueSenders = new Set(senders).size;

                const percentageTag = (incomingTxCountWithTag / incomingTXS.length) * 100;

                if (uniqueSenders >= 10 && percentageTag > 50) {
                    assign(info, { requireDestinationTag: true, possibleExchange: true });
                }
            }
        }

        return info;
    };

    getPayIdInfo = (payId: string): Promise<PayIDInfo | undefined> => {
        return BackendService.lookup(payId)
            .then((res) => {
                if (res) {
                    if (Array.isArray(res.matches) && res.matches.length > 0) {
                        const match = res.matches[0];
                        return {
                            account: match.account,
                            tag: match.tag,
                        };
                    }
                }
                return undefined;
            })
            .catch(() => {
                return undefined;
            });
    };
}

export default new AccountResolver();
