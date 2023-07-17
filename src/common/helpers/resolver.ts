import { memoize, has, get, assign } from 'lodash';

import Amount from '@common/libs/ledger/parser/common/amount';

import AccountRepository from '@store/repositories/account';
import ContactRepository from '@store/repositories/contact';

import LedgerService from '@services/LedgerService';
import BackendService from '@services/BackendService';

export interface PayIDInfo {
    account: string;
    tag: string;
}

export interface AccountNameType {
    address: string;
    name: string;
    source: string;
    kycApproved?: boolean;
}

export interface AccountInfoType {
    exist: boolean;
    risk: 'ERROR' | 'UNKNOWS' | 'PROBABLE' | 'HIGH_PROBABILITY' | 'CONFIRMED';
    requireDestinationTag: boolean;
    possibleExchange: boolean;
    disallowIncomingXRP: boolean;
    blackHole: boolean;
}

const getAccountName = memoize(
    (address: string, tag = '', internal = false): Promise<AccountNameType> => {
        return new Promise((resolve) => {
            const notFound = {
                address,
                name: '',
                source: '',
            };

            if (!address) {
                resolve(notFound);
                return;
            }

            // check address  book
            try {
                const filter = { address, destinationTag: tag };
                const contact = ContactRepository.findOne(filter);

                if (contact) {
                    resolve({
                        address,
                        name: contact.name,
                        source: 'contacts',
                    });
                    return;
                }
            } catch {
                // ignore
            }

            try {
                // check in accounts list
                const account = AccountRepository.findOne({ address });
                if (account) {
                    resolve({
                        address,
                        name: account.label,
                        source: 'accounts',
                    });
                    return;
                }
            } catch {
                // ignore
            }

            // only lookup for local result
            if (internal) {
                resolve(notFound);
                return;
            }

            // check the backend
            BackendService.getAddressInfo(address)
                .then((res: any) => {
                    if (res) {
                        resolve({
                            address,
                            name: res.name,
                            source: res.source?.replace('internal:', '').replace('.com', ''),
                            kycApproved: res.kycApproved,
                        });
                        return;
                    }
                    resolve(notFound);
                })
                .catch(() => {
                    resolve(notFound);
                });
        });
    },
    (address: string, tag = '') => `${address}${tag}`,
);

const getAccountInfo = (address: string): Promise<AccountInfoType> => {
    /* eslint-disable-next-line  */
    return new Promise(async (resolve, reject) => {
        if (!address) {
            reject();
            return;
        }

        const info = {
            exist: true,
            risk: 'UNKNOWS',
            requireDestinationTag: false,
            possibleExchange: false,
            disallowIncomingXRP: false,
            blackHole: false,
        } as AccountInfoType;

        try {
            // get account risk level
            const accountAdvisory = await BackendService.getAccountAdvisory(address);

            if (has(accountAdvisory, 'danger')) {
                assign(info, { risk: accountAdvisory.danger });
            } else {
                reject();
                return;
            }

            const accountInfo = await LedgerService.getAccountInfo(address);

            // account doesn't exist, no need to check account risk
            if (has(accountInfo, 'error')) {
                if (get(accountInfo, 'error') === 'actNotFound') {
                    resolve(assign(info, { exist: false }));
                    return;
                }
                reject();
                return;
            }

            const { account_data, account_flags } = accountInfo;

            // if balance is more than 1m possibly exchange account
            if (has(account_data, ['Balance'])) {
                if (new Amount(account_data.Balance, true).dropsToNative(true) > 1000000) {
                    assign(info, { possibleExchange: true });
                }
            }

            // check for black hole
            if (has(account_data, ['RegularKey'])) {
                if (
                    account_flags.disableMasterKey &&
                    ['rrrrrrrrrrrrrrrrrrrrrhoLvTp', 'rrrrrrrrrrrrrrrrrrrrBZbvji'].indexOf(account_data.RegularKey) > -1
                ) {
                    assign(info, { blackHole: true });
                }
            }

            // check for disallow incoming XRP
            if (account_flags.disallowIncomingXRP) {
                assign(info, { disallowIncomingXRP: true });
            }

            if (get(accountAdvisory, 'force_dtag')) {
                // first check on account advisory
                assign(info, { requireDestinationTag: true, possibleExchange: true });
            } else if (account_flags.requireDestinationTag) {
                // check if account have the required destination tag flag set
                assign(info, { requireDestinationTag: true, possibleExchange: true });
            } else {
                // scan the most recent transactions of the account for the destination tags
                const accountTXS = await LedgerService.getTransactions(address, undefined, 200);
                if (
                    typeof accountTXS.transactions !== 'undefined' &&
                    accountTXS.transactions &&
                    accountTXS.transactions.length > 0
                ) {
                    const incomingTXS = accountTXS.transactions.filter((tx) => {
                        return tx.tx.Destination === address;
                    });

                    const incomingTxCountWithTag = incomingTXS.filter((tx) => {
                        return (
                            typeof tx.tx.TransactionType === 'string' &&
                            typeof tx.tx.DestinationTag !== 'undefined' &&
                            tx.tx.DestinationTag > 9999
                        );
                    }).length;

                    const senders = accountTXS.transactions.map((tx) => {
                        return tx.tx.Account || '';
                    });

                    const uniqueSenders = senders.filter((elem, pos) => {
                        return senders.indexOf(elem) === pos;
                    }).length;

                    const percentageTag = (incomingTxCountWithTag / incomingTXS.length) * 100;

                    if (uniqueSenders >= 10 && percentageTag > 50) {
                        assign(info, { requireDestinationTag: true, possibleExchange: true });
                    }
                }
            }

            resolve(info);
        } catch {
            reject();
        }
    });
};

const getPayIdInfo = (payId: string): Promise<PayIDInfo> => {
    return new Promise((resolve) => {
        BackendService.lookup(payId)
            .then((res: any) => {
                if (res && res.error !== true) {
                    if (res.matches) {
                        const match = res.matches[0];
                        return resolve({
                            account: match.account,
                            tag: match.tag,
                        });
                    }
                }
                return resolve(undefined);
            })
            .catch(() => {
                return resolve(undefined);
            });
    });
};

export { getAccountName, getAccountInfo, getPayIdInfo };
