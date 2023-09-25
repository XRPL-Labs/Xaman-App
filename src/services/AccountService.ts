/**
 * AccountService
 * Subscribe to account changes and transactions
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */

import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get, keys } from 'lodash';

import { TrustLineModel } from '@store/models';
import { AccountRepository, CurrencyRepository } from '@store/repositories';

import Meta from '@common/libs/ledger/parser/meta';
import { Amount } from '@common/libs/ledger/parser/common';

import { LedgerTransactionType } from '@common/libs/ledger/types';

import NetworkService from '@services/NetworkService';
import LoggerService from '@services/LoggerService';
import LedgerService from '@services/LedgerService';
import { AccountTypes } from '@store/types';

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

                // on network service connect
                NetworkService.on('connect', this.onNetworkConnect);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Update the details when connect to the network
     */
    onNetworkConnect = () => {
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
            NetworkService.offEvent('transaction', this.transactionHandler);
        }
        // create the new listener
        this.transactionListener = NetworkService.onEvent('transaction', this.transactionHandler);
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

        // no account is present in the app
        if (accounts.length === 0) {
            this.accounts = [];
            return;
        }

        // log the existent accounts in the session log
        this.logger.debug(
            `Presented accounts: ${accounts.reduce(
                (account, item) =>
                    `${account}\n${item.address}-${item.accessLevel} ${
                        item.flags?.disableMasterKey ? '[MasterDisabled]' : ''
                    } ${item.type !== AccountTypes.Regular ? `[${item.type}]` : ''}`,
                '',
            )}`,
        );

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
                    // reset account details to default
                    await AccountRepository.updateDetails(account, {
                        id: `${account}.${NetworkService.getNetworkId()}`,
                        network: NetworkService.getNetwork(),
                        ownerCount: 0,
                        sequence: 0,
                        balance: 0,
                        flagsString: JSON.stringify({}),
                        regularKey: '',
                        domain: '',
                        emailHash: '',
                        messageKey: '',
                        lines: [],
                    });
                }

                // log the error and return
                this.logger.warn(`Fetch account info [${account}]:`, accountInfo?.error);
                return;
            }

            // fetch the normalized account lines
            const normalizedAccountLines = (await this.getNormalizedAccountLines(account)) as TrustLineModel[];

            // if account FOUND and no error
            const { account_data, account_flags } = accountInfo;

            // update account info
            await AccountRepository.updateDetails(account, {
                id: `${account}.${NetworkService.getNetworkId()}`,
                network: NetworkService.getNetwork(),
                ownerCount: account_data.OwnerCount,
                sequence: account_data.Sequence,
                balance: new Amount(account_data.Balance).dropsToNative(true),
                flagsString: JSON.stringify(account_flags),
                regularKey: get(account_data, 'RegularKey', ''),
                domain: get(account_data, 'Domain', ''),
                emailHash: get(account_data, 'EmailHash', ''),
                messageKey: get(account_data, 'MessageKey', ''),
                lines: normalizedAccountLines,
            });
        } catch (e: any) {
            throw new Error(e);
        }
    };

    /**
     * Get normalized account lines
     */
    getNormalizedAccountLines = async (account: string): Promise<Partial<TrustLineModel>[]> => {
        try {
            // fetch filtered account lines from ledger
            let accountLines = await LedgerService.getFilteredAccountLines(account);

            // fetch account obligations lines
            const accountObligations = await LedgerService.getAccountObligations(account);

            // if there is any obligations lines combine result
            if (!isEmpty(accountObligations)) {
                accountLines = accountLines.concat(accountObligations);
            }

            // create empty list base on TrustLineModel
            const normalizedList = [] as Partial<TrustLineModel>[];

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
                        // id: `${account}.${currency.id}.${NetworkService.getNetworkId()}`,
                        id: `${account}.${currency.id}}`,
                        currency,
                        balance: line.balance,
                        no_ripple: get(line, 'no_ripple', false),
                        no_ripple_peer: get(line, 'no_ripple_peer', false),
                        limit: line.limit,
                        limit_peer: line.limit_peer,
                        quality_in: get(line, 'quality_in', 0),
                        quality_out: get(line, 'quality_out', 0),
                        authorized: get(line, 'authorized', false),
                        peer_authorized: get(line, 'peer_authorized', false),
                        freeze: get(line, 'freeze', false),
                        obligation: get(line, 'obligation', false),
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

        NetworkService.send({
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

        NetworkService.send({
            command: 'subscribe',
            accounts: this.accounts,
        }).catch((e: any) => {
            this.logger.warn('Unable to Subscribe accounts', e);
        });
    }
}

export default new AccountService();
