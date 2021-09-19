/**
 * AccountService
 * Subscribe to account changes and transactions
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */

import moment from 'moment-timezone';
import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get, omitBy, keys } from 'lodash';

import { TrustLineSchema } from '@store/schemas/latest';
import AccountRepository from '@store/repositories/account';
import CurrencyRepository from '@store/repositories/currency';

import { Amount } from '@common/libs/ledger/parser/common';
import Meta from '@common/libs/ledger/parser/meta';

import { LedgerTransactionType } from '@common/libs/ledger/types';

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
        if (!this.transactionListener) {
            this.transactionListener = SocketService.onEvent('transaction', this.transactionHandler);
        }
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

        this.accounts = flatMap(accounts, (a) => {
            return { address: a.address, lastSync: 0 };
        });

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

    getAccountObligations = (account: string) => {
        return new Promise((resolve) => {
            LedgerService.getGatewayBalances(account)
                .then((accountObligations: any) => {
                    const obligationsLines = [] as any[];

                    const { obligations } = accountObligations;

                    if (isEmpty(obligations)) return resolve([]);

                    map(obligations, (b, c) => {
                        // add to trustLines list
                        obligationsLines.push({
                            account,
                            currency: c,
                            balance: new Amount(-b, false).toNumber(),
                            limit: 0,
                            limit_peer: 0,
                            transfer_rate: 0,
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
     * Update account trustLines
     */
    updateAccountLines = (account: string) => {
        return new Promise<void>((resolve, reject) => {
            LedgerService.getAccountLines(account)
                .then(async (accountLines: any) => {
                    const { lines } = accountLines;

                    const normalizedList = [] as Partial<TrustLineSchema>[];

                    // ignore incoming trustline
                    let filteredLines = flatMap(
                        omitBy(lines, (l: any) => {
                            return (
                                Number(l.balance) < 0 ||
                                (Number(l.limit) === 0 && Number(l.limit_peer) > 0) ||
                                (Number(l.balance) === 0 && Number(l.limit) === 0 && Number(l.limit_peer) === 0)
                            );
                        }),
                    );

                    // get obligationsLines
                    const obligationsLines = await this.getAccountObligations(account);

                    // combine obligations lines with normal lines
                    filteredLines = filteredLines.concat(obligationsLines);

                    await Promise.all(
                        map(filteredLines, async (l) => {
                            // update currency
                            const currency = await CurrencyRepository.include({
                                issuer: l.account,
                                currency: l.currency,
                            });

                            // get transfer rate from issuer account
                            let transfer_rate = 0;
                            const issuerAccountInfo = await LedgerService.getAccountInfo(l.account);
                            if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                                const { TransferRate } = issuerAccountInfo.account_data;
                                transfer_rate = TransferRate;
                            }

                            // add to trustLines list
                            normalizedList.push({
                                id: `${account}.${currency.id}`,
                                currency,
                                balance: new Amount(l.balance, false).toNumber(),
                                transfer_rate,
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
                if (include.indexOf(account.address) === -1) return;
            }

            // prevent unnecessary requests
            // if (account.lastSync) {
            //     const passedSeconds = moment().diff(moment.unix(account.lastSync), 'second');

            //     if (passedSeconds <= 2) {
            //         return;
            //     }
            // }

            this.updateAccountInfo(account.address)
                .then(() => this.updateAccountLines(account.address))
                .catch((e) => {
                    this.logger.warn(`Update account info [${account.address}] `, e);
                });

            // update last sync
            this.accounts = map(this.accounts, (a) => {
                return a.address === account.address ? { address: account.address, lastSync: moment().unix() } : a;
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
        this.accounts = flatMap(accounts, (a) => {
            return { address: a.address, lastSync: 0 };
        });

        // subscribe
        this.subscribe();

        // update accounts info
        this.updateAccountsDetails();
    };

    /**
     * Unsubscribe for streaming
     */
    unsubscribe() {
        const arrayAccounts = flatMap(this.accounts, (a) => [a.address]);

        this.logger.debug(`Unsubscribe to ${arrayAccounts} accounts`, arrayAccounts);

        SocketService.send({
            command: 'unsubscribe',
            accounts: arrayAccounts,
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

        const arrayAccounts = flatMap(this.accounts, (a) => [a.address]);

        this.logger.debug(`Subscribed to ${arrayAccounts.length} accounts`, arrayAccounts);

        SocketService.send({
            command: 'subscribe',
            accounts: arrayAccounts,
        }).catch((e: any) => {
            this.logger.warn('Unable to Subscribe accounts', e);
        });
    }
}

export default new AccountService();
