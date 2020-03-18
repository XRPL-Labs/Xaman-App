/**
 * LedgerService service
 * Subscribe to account changes from connected rippled node
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */

import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get } from 'lodash';

import { TrustLineSchema } from '@store/schemas/latest';
import { AccountRepository, CurrencyRepository } from '@store/repositories';

import { Amount } from '@common/libs/ledger/parser/common';
import { AccountTxResponse, LedgerMarker } from '@common/libs/ledger/types';
import parserFactory from '@common/libs/ledger/parser';

import { LoggerService, SocketService } from '@services';

// events
declare interface LedgerService {
    on(event: 'onTransaction', listener: (name: string) => void): this;
    on(event: string, listener: Function): this;
}

class LedgerService extends EventEmitter {
    accounts: Array<any>;
    logger: any;

    constructor() {
        super();

        this.accounts = [];
        this.logger = LoggerService.createLogger('Ledger');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                this.loadAccounts();

                // on socket service connect
                SocketService.on('connect', () => {
                    // update account details
                    this.updateAccountsDetails();
                    // subscribe accounts for transactions stream
                    this.subscribe();
                    // register on transaction event handler
                    this.transactionHandler();
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    /**
     * Get Current ledger status
     */
    getLedgerStatus = (): { Fee: number; LastLedger: number } => {
        if (SocketService.connection) {
            const { fee, ledger } = SocketService.connection.getState();
            return {
                Fee: fee.last,
                LastLedger: ledger.last,
            };
        }

        return {
            Fee: 0,
            LastLedger: 0,
        };
    };

    /**
     * Get account info
     */
    getAccountInfo = (account: string): any => {
        return SocketService.send({
            command: 'account_info',
            account,
            ledger_index: 'validated',
            signer_lists: true,
        });
    };

    /**
     * Get Offers from order book
     */
    getOffers = (request: any): any => {
        return SocketService.send({
            command: 'book_offers',
            ...request,
        });
    };

    /**
     * Get account trust lines
     */
    getAccountLines = (account: string): any => {
        return SocketService.send({
            command: 'account_lines',
            account,
        });
    };

    getTransaction = (txId: string) => {
        return SocketService.send({
            command: 'tx',
            transaction: txId,
            binary: false,
        });
    };

    /**
     * Get account transactions
     */
    getTransactions = (account: string, marker?: LedgerMarker, limit?: number): Promise<AccountTxResponse> => {
        const request = {
            command: 'account_tx',
            account,
            limit: limit || 20,
            binary: false,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return SocketService.send(request);
    };

    /**
     * Submit signed transaction to the XRP Ledger
     */
    submit = (tx_blob: string): any => {
        return SocketService.send({
            command: 'submit',
            tx_blob,
        });
    };

    /**
     * Handle stream transactions
     */
    transactionHandler() {
        SocketService.onEvent('transaction', (tx: any) => {
            // parse transaction
            const transaction = parserFactory(tx);
            this.logger.debug('Transaction Received: ', transaction);

            // update account details
            this.updateAccountsDetails([transaction.Account.address, transaction.Destination?.address]);

            // emit onTransaction event
            this.emit('transaction', transaction);
        });
    }

    /**
     * load accounts from store
     */
    loadAccounts = () => {
        const accounts = AccountRepository.getAccounts();

        this.accounts = flatMap(accounts, a => {
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
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((accountInfo: any) => {
                    this.logger.debug(`Account info ${account}`, accountInfo);

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
                    reject(new Error('Unable get Account info'));
                    this.logger.error('Unable get Account info', e);
                });
        });
    };

    /**
     * Update account trustLines
     */
    updateAccountLines = (account: string) => {
        return new Promise((resolve, reject) => {
            this.getAccountLines(account)
                .then(async (accountLines: any) => {
                    const { lines } = accountLines;

                    const normalizedList = [] as Partial<TrustLineSchema>[];

                    await Promise.all(
                        map(lines, async l => {
                            // update currency
                            const currency = await CurrencyRepository.upsert(
                                { id: uuidv4(), issuer: l.account, currency: l.currency },
                                { issuer: l.account, currency: l.currency },
                            );

                            // get transfer rate from issuer account
                            let transfer_rate = 0;
                            const issuerAccountInfo = await this.getAccountInfo(l.account);
                            if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                                const { TransferRate } = issuerAccountInfo.account_data;
                                transfer_rate = TransferRate;
                            }
                            // add to trustLines list
                            normalizedList.push({
                                currency,
                                transfer_rate,
                                limit: new Amount(l.limit, false).toNumber(),
                                limit_peer: new Amount(l.limit_peer, false).toNumber(),
                                balance: new Amount(l.balance, false).toNumber(),
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
                    this.logger.error('Unable get Account lines', e);
                });
        });
    };

    /**
     * Update accounts details through socket request
     * this will contain account trustLines etc ...
     */
    updateAccountsDetails = (include?: string[]) => {
        forEach(this.accounts, account => {
            // check if include present
            if (!isEmpty(include)) {
                if (include.indexOf(account.address) === -1) return;
            }

            // prevent unnecessary requests
            if (account.lastSync) {
                const passedSeconds = moment().diff(moment.unix(account.lastSync), 'second');

                if (passedSeconds <= 2) {
                    return;
                }
            }

            this.updateAccountInfo(account.address)
                .then(() => this.updateAccountLines(account.address))
                .catch(e => {
                    this.logger.error('Account info error: ', e.message);
                });

            // update last sync
            this.accounts = map(this.accounts, a => {
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
        this.accounts = flatMap(accounts, a => {
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
        const arrayAccounts = flatMap(this.accounts, a => [a.address]);

        this.logger.debug(`Unsubscribe to ${arrayAccounts} accounts`, arrayAccounts);

        SocketService.send({
            command: 'unsubscribe',
            accounts: arrayAccounts,
        }).catch((e: any) => {
            this.logger.error('Unable to Unsubscribe accounts', e);
        });
    }

    /**
     * Subscribe for streaming
     */
    subscribe(soft?: boolean) {
        if (soft) {
            this.unsubscribe();
        }

        const arrayAccounts = flatMap(this.accounts, a => [a.address]);

        this.logger.debug(`Subscribed to ${arrayAccounts} accounts`, arrayAccounts);

        SocketService.send({
            command: 'subscribe',
            accounts: arrayAccounts,
        }).catch((e: any) => {
            this.logger.error('Unable to Subscribe accounts', e);
        });
    }
}

export default new LedgerService();
