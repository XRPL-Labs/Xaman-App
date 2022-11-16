/**
 * AccountService
 * Subscribe to account changes and transactions
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */
import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get, keys } from 'lodash';

import { TrustLineSchema } from '@store/schemas/latest';
import AccountRepository from '@store/repositories/account';
import CurrencyRepository from '@store/repositories/currency';

import Meta from '@common/libs/ledger/parser/meta';
import { Amount } from '@common/libs/ledger/parser/common';

import { LedgerTransactionType } from '@common/libs/ledger/types';

import SocketService from '@services/SocketService';
import LoggerService from '@services/LoggerService';
import LedgerService from '@services/LedgerService';

/* events  ==================================================================== */
declare interface AccountService {
    on(
        event: 'transaction',
        listener: (transaction: LedgerTransactionType, effectedAccounts: Array<string>) => void,
    ): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class AccountService extends EventEmitter {
    private accounts: string[];
    private logger: any;
    private transactionListener: any;

    constructor() {
        super();

        this.accounts = [];
        this.logger = LoggerService.createLogger('Account');
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // load accounts
                this.loadAccounts();

                // add listeners for account changes
                AccountRepository.on('accountCreate', this.onAccountsChange);
                AccountRepository.on('accountRemove', this.onAccountsChange);

                // on socket service connect
                SocketService.on('connect', this.onSocketConnect);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Update the details when connect to the socket
     */
    onSocketConnect = () => {
        // update account details
        this.updateAccountsDetails();
        // subscribe accounts for transactions stream
        this.subscribe();
        // register on transaction event handler
        this.setTransactionListener();
    };

    /**
     * Set transaction listener if not set
     */
    setTransactionListener = () => {
        // if already any listener remove it
        if (this.transactionListener) {
            SocketService.offEvent('transaction', this.transactionHandler);
        }
        // create the new listener
        this.transactionListener = SocketService.onEvent('transaction', this.transactionHandler);
    };

    /**
     * Handle stream transactions on subscribed accounts
     */
    transactionHandler = (tx: LedgerTransactionType) => {
        const { transaction, meta } = tx;

        if (typeof transaction === 'object' && typeof meta === 'object') {
            this.logger.debug(`Transaction received: ${get(transaction, 'hash', 'NO_HASH')}`);

            // get effected accounts
            const effectedAccounts = keys(new Meta(meta).parseBalanceChanges());

            // update account details
            this.updateAccountsDetails(effectedAccounts);

            // emit onTransaction event
            this.emit('transaction', transaction, effectedAccounts);
        }
    };

    /**
     * Load accounts from data store
     */
    loadAccounts = () => {
        const accounts = AccountRepository.getAccounts();
        this.accounts = flatMap(accounts, (a) => a.address);
    };

    /**
     * Update account info, contain balance etc ...
     */
    updateAccountInfo = async (account: string) => {
        try {
            // fetch account info from ledger
            const accountInfo = await LedgerService.getAccountInfo(account);

            // if there is any error in the response return and ignore fetching the account lines
            if (!accountInfo || has(accountInfo, 'error')) {
                // account not found reset account to default state
                if (get(accountInfo, 'error') === 'actNotFound') {
                    // reset account , this is necessary for when changing node chain
                    await AccountRepository.update({
                        address: account,
                        ownerCount: 0,
                        sequence: 0,
                        balance: 0,
                        flags: 0,
                        regularKey: '',
                        lines: [],
                    });
                }

                // log the error and return
                this.logger.warn(`Fetch account info [${account}]:`, accountInfo?.error);
                return;
            }

            // fetch the normalized account lines
            const normalizedAccountLines = await this.getNormalizedAccountLines(account);

            // if account FOUND and no error
            const { account_data } = accountInfo;

            // update account info
            await AccountRepository.update({
                address: account,
                ownerCount: account_data.OwnerCount,
                sequence: account_data.Sequence,
                balance: new Amount(account_data.Balance).dropsToXrp(true),
                flags: account_data.Flags,
                regularKey: account_data.RegularKey || '',
                lines: normalizedAccountLines,
            });
        } catch (e: any) {
            throw new Error(e);
        }
    };

    /**
     * Get normalized account lines
     */
    getNormalizedAccountLines = async (account: string): Promise<Partial<TrustLineSchema>[]> => {
        try {
            // fetch filtered account lines from ledger
            let accountLines = await LedgerService.getFilteredAccountLines(account);

            // fetch account obligations lines
            const accountObligations = await LedgerService.getAccountObligations(account);

            // if there is any obligations lines combine result
            if (!isEmpty(accountObligations)) {
                accountLines = accountLines.concat(accountObligations);
            }

            // create empty list base on TrustLineSchema
            const normalizedList = [] as Partial<TrustLineSchema>[];

            // process every line exist in the accountLines
            await Promise.all(
                map(accountLines, async (line) => {
                    // upsert currency object in the store
                    const currency = await CurrencyRepository.include({
                        id: `${line.account}.${line.currency}`,
                        issuer: line.account,
                        currency: line.currency,
                    });

                    // convert trust line to the normalized format
                    normalizedList.push({
                        id: `${account}.${currency.id}`,
                        currency,
                        balance: new Amount(line.balance, false).toNumber(),
                        no_ripple: line.no_ripple || false,
                        no_ripple_peer: line.no_ripple_peer || false,
                        limit: new Amount(line.limit, false).toNumber(),
                        limit_peer: new Amount(line.limit_peer, false).toNumber(),
                        quality_in: line.quality_in || 0,
                        quality_out: line.quality_out || 0,
                        authorized: line.authorized || false,
                        peer_authorized: line.peer_authorized || false,
                        freeze: line.freeze || false,
                        obligation: line.obligation || false,
                    });
                }),
            );

            // return normalized list
            return normalizedList;
        } catch (e) {
            throw new Error('Unable get Account lines');
        }
    };

    /**
     * Update accounts details through socket request
     * this will contain account trustLines etc ...
     */
    updateAccountsDetails = (include?: string[]) => {
        forEach(this.accounts, (account) => {
            // check if include present
            if (!isEmpty(include)) {
                if (include.indexOf(account) === -1) return;
            }

            this.updateAccountInfo(account).catch((e) => {
                this.logger.error(`Update account info [${account}] `, e);
            });
        });
    };

    /**
     * Watch for any account change in store
     */
    onAccountsChange = () => {
        // unsubscribe from old list
        this.unsubscribe();

        // reload accounts
        this.loadAccounts();

        // subscribe again on new account list
        this.subscribe();

        // update accounts info
        this.updateAccountsDetails();
    };

    /**
     * Unsubscribe for streaming
     */
    unsubscribe() {
        this.logger.debug(`Unsubscribe to ${this.accounts.length} accounts`, this.accounts);

        SocketService.send({
            command: 'unsubscribe',
            accounts: this.accounts,
        }).catch((e: any) => {
            this.logger.warn('Unable to Unsubscribe accounts', e);
        });
    }

    /**
     * Subscribe for streaming
     */
    subscribe() {
        this.logger.debug(`Subscribed to ${this.accounts.length} accounts`, this.accounts);

        SocketService.send({
            command: 'subscribe',
            accounts: this.accounts,
        }).catch((e: any) => {
            this.logger.warn('Unable to Subscribe accounts', e);
        });
    }
}

export default new AccountService();
