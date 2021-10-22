/**
 * AccountService
 * Subscribe to account changes and transactions
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */
import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get, omitBy, keys } from 'lodash';

import { TrustLineSchema } from '@store/schemas/latest';
import AccountRepository from '@store/repositories/account';
import CurrencyRepository from '@store/repositories/currency';

import { Amount } from '@common/libs/ledger/parser/common';
import Meta from '@common/libs/ledger/parser/meta';

import { LedgerTransactionType, LedgerTrustline } from '@common/libs/ledger/types';

import SocketService from '@services/SocketService';
import LoggerService from '@services/LoggerService';
import LedgerService from '@services/LedgerService';

/* Service  ==================================================================== */
class AccountService extends EventEmitter {
    accounts: Array<any>;
    logger: any;
    transactionListener: any;

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

                // on socket service connect
                SocketService.on('connect', () => {
                    // update account details
                    this.updateAccountsDetails();
                    // subscribe accounts for transactions stream
                    this.subscribe();
                    // register on transaction event handler
                    this.setTransactionListener();
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    /**
     * Set transaction listener if not set
     */
    setTransactionListener = () => {
        if (this.transactionListener) {
            SocketService.offEvent('transaction', this.transactionHandler);
        }
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
            this.emit('transaction', transaction);
        }
    };

    /**
     * load accounts from store
     */
    loadAccounts = () => {
        const accounts = AccountRepository.getAccounts();

        this.accounts = flatMap(accounts, (a) => a.address);

        // add listeners for account changes
        AccountRepository.on('accountCreate', this.onAccountsChange);
        AccountRepository.on('accountRemove', this.onAccountsChange);
    };

    /**
     * Update account info, contain balance etc ...
     */
    updateAccountInfo = (account: string) => {
        return new Promise<void>((resolve, reject) => {
            LedgerService.getAccountInfo(account)
                .then((accountInfo: any) => {
                    // TODO: handle errors
                    if (!accountInfo || has(accountInfo, 'error')) {
                        if (get(accountInfo, 'error') === 'actNotFound') {
                            // reset account , this is good for node change
                            AccountRepository.update({
                                address: account,
                                ownerCount: 0,
                                sequence: 0,
                                balance: 0,
                                flags: 0,
                                regularKey: '',
                                lines: [],
                            });
                        }

                        // reject the update
                        reject(new Error(`${accountInfo?.error}`));
                        return;
                    }

                    // if account FOUND and no error
                    const { account_data } = accountInfo;

                    // update account info
                    AccountRepository.update({
                        address: account,
                        ownerCount: account_data.OwnerCount,
                        sequence: account_data.Sequence,
                        // @ts-ignore
                        balance: new Amount(account_data.Balance).dropsToXrp(true),
                        flags: account_data.Flags,
                        regularKey: account_data.RegularKey || '',
                    });

                    // resolve
                    resolve();
                })
                .catch((e: any) => {
                    reject(e);
                    this.logger.warn(`Unable get Account info ${account} `, e);
                });
        });
    };

    getAccountObligations = (account: string): Promise<LedgerTrustline[]> => {
        return new Promise((resolve) => {
            LedgerService.getGatewayBalances(account)
                .then((accountObligations: any) => {
                    const { obligations } = accountObligations;

                    if (isEmpty(obligations)) return resolve([]);

                    const obligationsLines = [] as LedgerTrustline[];

                    map(obligations, (b, c) => {
                        obligationsLines.push({
                            account,
                            currency: c,
                            balance: new Amount(-b, false).toString(false),
                            limit: '0',
                            limit_peer: '0',
                            quality_in: 0,
                            quality_out: 0,
                            obligation: true,
                        });
                    });

                    return resolve(obligationsLines);
                })
                .catch(() => {
                    return resolve([]);
                });
        });
    };

    /**
     * returns all outgoing account lines
     */
    getFilteredAccountLines = async (
        account: string,
        marker?: string,
        combined = [] as LedgerTrustline[],
    ): Promise<LedgerTrustline[]> => {
        return LedgerService.getAccountLines(account, { marker }).then((resp) => {
            const { lines, marker: _marker } = resp;
            // filter incoming trust lines
            const filtered = flatMap(
                omitBy(lines, (l: any) => {
                    return (
                        Number(l.balance) < 0 ||
                        (Number(l.limit) === 0 && Number(l.limit_peer) > 0) ||
                        (Number(l.balance) === 0 && Number(l.limit) === 0 && Number(l.limit_peer) === 0)
                    );
                }),
            );
            if (_marker) {
                return this.getFilteredAccountLines(account, _marker, filtered);
            }
            return filtered.concat(combined);
        });
    };

    /**
     * Update account trustLines
     */
    updateAccountLines = (account: string) => {
        return new Promise<void>((resolve, reject) => {
            this.getFilteredAccountLines(account)
                .then(async (accountLines: any[]) => {
                    const normalizedList = [] as Partial<TrustLineSchema>[];

                    // get obligationsLines
                    const obligationsLines = await this.getAccountObligations(account);

                    // combine obligations lines with normal lines
                    accountLines = accountLines.concat(obligationsLines);

                    await Promise.all(
                        map(accountLines, async (l) => {
                            // update currency
                            const currency = await CurrencyRepository.include({
                                issuer: l.account,
                                currency: l.currency,
                            });

                            // add to trustLines list
                            normalizedList.push({
                                id: `${account}.${currency.id}`,
                                currency,
                                balance: new Amount(l.balance, false).toNumber(),
                                no_ripple: l.no_ripple || false,
                                no_ripple_peer: l.no_ripple_peer || false,
                                limit: new Amount(l.limit, false).toNumber(),
                                limit_peer: new Amount(l.limit_peer, false).toNumber(),
                                quality_in: l.quality_in || 0,
                                quality_out: l.quality_out || 0,
                                authorized: l.authorized || false,
                                peer_authorized: l.peer_authorized || false,
                                freeze: l.freeze || false,
                                obligation: l.obligation || false,
                            });
                        }),
                    );

                    // update trust lines
                    AccountRepository.update({
                        address: account,
                        lines: normalizedList,
                    });

                    resolve();
                })
                .catch((e: any) => {
                    reject(new Error('Unable get Account lines'));
                    this.logger.warn('Unable get Account lines', e);
                });
        });
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

            this.updateAccountInfo(account)
                .then(() => this.updateAccountLines(account))
                .catch((e) => {
                    this.logger.warn(`Update account info [${account}] `, e);
                });
        });
    };

    /**
     * Watch for any account change in store
     */
    onAccountsChange = () => {
        // unsubscribe
        this.unsubscribe();

        // reload accounts
        const accounts = AccountRepository.getAccounts();
        this.accounts = flatMap(accounts, (a) => a.address);

        // subscribe
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
    subscribe(soft?: boolean) {
        if (soft) {
            this.unsubscribe();
        }

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
