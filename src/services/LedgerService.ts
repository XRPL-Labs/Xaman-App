/**
 * LedgerService service
 * Subscribe to account changes from connected rippled node
 * This is the service we use for update accounts real time details and listen for ledger transactions
 */

import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import EventEmitter from 'events';
import { map, isEmpty, flatMap, forEach, has, get, assign, omitBy } from 'lodash';

import { TrustLineSchema } from '@store/schemas/latest';
import AccountRepository from '@store/repositories/account';
import CurrencyRepository from '@store/repositories/currency';

import { Amount } from '@common/libs/ledger/parser/common';
import { AccountTxResponse, LedgerMarker, SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';

import SocketService from '@services/SocketService';
import LoggerService from '@services/LoggerService';

/* events  ==================================================================== */
declare interface LedgerService {
    on(event: 'onTransaction', listener: (name: string) => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
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
     * Get ledger info
     */
    getLedgerEntry = (index: string): any => {
        return SocketService.send({
            command: 'ledger_entry',
            index,
            ledger_index: 'validated',
        });
    };

    /**
     * Get account info
     */
    getGatewayBalances = (account: string): any => {
        return SocketService.send({
            command: 'gateway_balances',
            account,
            strict: true,
            ledger_index: 'validated',
            hotwallet: [account],
        });
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
     * Get account objects
     */
    getAccountObjects = (account: string): any => {
        return SocketService.send({
            command: 'account_objects',
            account,
            ledger_index: 'validated',
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
     * get server info
     */
    getServerInfo = () => {
        return SocketService.send({
            command: 'server_info',
        });
    };

    /**
     * get ledger time from server
     */
    getLedgerTime = () => {
        return new Promise((resolve, reject) => {
            this.getServerInfo()
                .then((server_info: any) => {
                    const { info } = server_info;
                    resolve(moment.utc(info.time, 'YYYY-MMM-DD HH:mm:ss.SSS').format());
                })
                .catch(() => {
                    reject();
                });
        });
    };

    /**
     * Submit signed transaction to the XRP Ledger
     */
    submitTX = async (tx_blob: string): Promise<SubmitResultType> => {
        try {
            const submitResult = await SocketService.send({
                command: 'submit',
                tx_blob,
            });

            const {
                error,
                error_message,
                error_exception,
                engine_result,
                tx_json,
                engine_result_message,
            } = submitResult;

            this.logger.debug('Submit Result TX:', submitResult);

            // create default result
            const result = {
                transactionId: tx_json?.hash,
                node: SocketService.node,
                nodeType: SocketService.chain,
            };

            // error happened in validation of transaction
            // probably something missing
            if (error) {
                return assign(result, {
                    success: false,
                    engineResult: error,
                    message: error_message || error_exception,
                });
            }

            // result code prefix
            const prefix = engine_result.substr(0, 3);

            // probably success submit
            if (['tes', 'tel', 'ter'].indexOf(prefix) > -1) {
                return assign(result, {
                    success: true,
                    engineResult: engine_result,
                    message: engine_result_message,
                });
            }

            // didn't got any possible success result
            return Object.assign(result, {
                success: false,
                engineResult: engine_result,
                message: engine_result_message,
            });
        } catch (e) {
            // something wrong happened
            return {
                success: false,
                engineResult: 'telFAILED',
                message: e.message,
                node: SocketService.node,
                nodeType: SocketService.chain,
            };
        }
    };

    verifyTx = (transactionId: string): Promise<VerifyResultType> => {
        return new Promise((resolve) => {
            // wait for ledger close event
            let verified = false;
            const ledgerListener = async () => {
                this.getTransaction(transactionId)
                    .then((tx: any) => {
                        if (tx.validated) {
                            SocketService.offEvent('ledger', ledgerListener);
                            verified = true;

                            const { TransactionResult } = tx.meta;

                            resolve({
                                success: TransactionResult === 'tesSUCCESS',
                                transaction: tx,
                            });
                        }
                    })
                    .catch(() => {});
            };

            SocketService.onEvent('ledger', ledgerListener);

            // timeout after 20 sec
            setTimeout(() => {
                if (!verified) {
                    SocketService.offEvent('ledger', ledgerListener);
                    resolve({
                        success: false,
                    });
                }
            }, 30000);
        });
    };

    /**
     * Handle stream transactions
     */
    transactionHandler() {
        SocketService.onEvent('transaction', (tx: any) => {
            const { transaction } = tx;

            this.logger.debug('Transaction Received: ', transaction);

            // update account details
            this.updateAccountsDetails([transaction.Account, transaction.Destination]);

            // emit onTransaction event
            this.emit('transaction', transaction);
        });
    }

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
                    reject(e);
                    this.logger.warn('Unable get Account info', e);
                });
        });
    };

    getAccountObligations = (account: string) => {
        return new Promise((resolve) => {
            this.getGatewayBalances(account)
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
        return new Promise((resolve, reject) => {
            this.getAccountLines(account)
                .then(async (accountLines: any) => {
                    const { lines } = accountLines;

                    const normalizedList = [] as Partial<TrustLineSchema>[];

                    // ignore incoming trustline
                    let filteredLines = flatMap(
                        omitBy(lines, (l: any) => {
                            return Number(l.balance) < 0 || (Number(l.limit) === 0 && Number(l.limit_peer) > 0);
                        }),
                    );

                    // get obligationsLines
                    const obligationsLines = await this.getAccountObligations(account);

                    // combine obligations lines with normal lines
                    filteredLines = filteredLines.concat(obligationsLines);

                    await Promise.all(
                        map(filteredLines, async (l) => {
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
                                balance: new Amount(l.balance, false).toNumber(15),
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
                    this.logger.warn('UpdateAccountInfo error: ', e);
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

export default new LedgerService();
