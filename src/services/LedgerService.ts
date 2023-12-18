/**
 * LedgerService service
 * fetching details from ledger - submit/verify transaction
 */
import EventEmitter from 'events';
import BigNumber from 'bignumber.js';
import moment from 'moment-timezone';
import { has, map, isEmpty, assign, startsWith } from 'lodash';

import { NetworkConfig } from '@common/constants';

import {
    LedgerMarker,
    SubmitResultType,
    VerifyResultType,
    AccountTxResponse,
    GatewayBalancesResponse,
    AccountInfoResponse,
    AccountObjectsResponse,
    LedgerTrustline,
    LedgerEntryResponse,
    RippleStateLedgerEntry,
    LedgerEntriesTypes,
    AccountNFTsResponse,
    LedgerNFToken,
} from '@common/libs/ledger/types';

import { Issuer } from '@common/libs/ledger/parser/types';
import { Amount } from '@common/libs/ledger/parser/common';
import { RippleStateToTrustLine } from '@common/libs/ledger/parser/entry';

import { LedgerObjectFlags } from '@common/libs/ledger/parser/common/flags/objectFlags';

import NetworkService from '@services/NetworkService';
import LoggerService from '@services/LoggerService';

/* Types  ==================================================================== */
declare interface LedgerService {
    on(event: 'submitTransaction', listener: (blob: string, hash: string, network: {}) => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class LedgerService extends EventEmitter {
    logger: any;

    constructor() {
        super();

        // create logger
        this.logger = LoggerService.createLogger('Ledger');
    }

    /**
     * Update network reserve
     */

    /**
     * Get Current ledger status
     */
    getLedgerStatus = (): { Fee: number; LastLedger: number } => {
        if (NetworkService.connection) {
            const { fee, ledger } = NetworkService.connection.getState();
            return {
                Fee: fee.avg,
                LastLedger: ledger.last,
            };
        }

        return {
            Fee: NetworkConfig.netFee,
            LastLedger: 0,
        };
    };

    /**
     * Get ledger entry
     */
    getLedgerEntry = (options?: any): Promise<any> => {
        const request = {
            command: 'ledger_entry',
            ledger_index: 'validated',
        };
        if (typeof options === 'object') {
            Object.assign(request, options);
        }
        return NetworkService.send(request);
    };

    /**
     * Get account info
     */
    getGatewayBalances = (account: string): Promise<GatewayBalancesResponse> => {
        return NetworkService.send({
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
    getAccountInfo = (account: string): Promise<AccountInfoResponse> => {
        return NetworkService.send({
            command: 'account_info',
            account,
            ledger_index: 'validated',
            signer_lists: false,
        });
    };

    /**
     * Get account objects
     */
    getAccountObjects = (account: string, options?: any): Promise<AccountObjectsResponse> => {
        const request = {
            command: 'account_objects',
            account,
            ledger_index: 'validated',
        };
        if (typeof options === 'object') {
            Object.assign(request, options);
        }
        return NetworkService.send(request);
    };

    /**
     * Get single transaction by providing transaction id
     */
    getTransaction = (txId: string) => {
        return NetworkService.send({
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
            limit: limit || 50,
            binary: false,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return NetworkService.send(request);
    };

    /**
     * Get account XLS20 NFTs
     */
    getAccountNFTs = (account: string, marker?: string, combined = [] as LedgerNFToken[]): Promise<LedgerNFToken[]> => {
        const request = {
            command: 'account_nfts',
            account,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return NetworkService.send(request).then((resp: AccountNFTsResponse) => {
            const { account_nfts, marker: _marker } = resp;
            if (_marker && _marker !== marker) {
                return this.getAccountNFTs(account, _marker, account_nfts.concat(combined));
            }
            return account_nfts.concat(combined);
        });
    };

    /**
     * Get ledger data
     */
    getLedgerData = (marker: string, limit?: number) => {
        const request = {
            command: 'ledger_data',
            limit: limit || 50,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return NetworkService.send(request);
    };

    /**
     * get server info
     */
    getServerInfo = () => {
        return NetworkService.send({
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
     * Get account obligation lines
     */
    getAccountObligations = (account: string): Promise<LedgerTrustline[]> => {
        return new Promise((resolve) => {
            this.getGatewayBalances(account)
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
     * Get account transfer rate on percent format
     */
    getAccountTransferRate = (account: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((issuerAccountInfo: any) => {
                    if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                        const { TransferRate } = issuerAccountInfo.account_data;
                        const transferFee = new BigNumber(TransferRate).dividedBy(10000000).minus(100).toNumber();
                        resolve(transferFee);
                        return;
                    }
                    resolve(0);
                })
                .catch(() => {
                    reject(new Error('Unable to fetch account transfer rate!'));
                });
        });
    };

    /**
     * Get account available native balance
     */
    getAccountAvailableBalance = (account: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((accountInfo) => {
                    if (
                        !has(accountInfo, 'error') &&
                        has(accountInfo, ['account_data', 'Balance']) &&
                        has(accountInfo, ['account_data', 'OwnerCount'])
                    ) {
                        const { Balance, OwnerCount } = accountInfo.account_data;
                        const { BaseReserve, OwnerReserve } = NetworkService.getNetworkReserve();

                        const balance = new BigNumber(Balance);

                        if (balance.isZero()) {
                            resolve(0);
                            return;
                        }

                        const availableBalance = balance
                            .dividedBy(1000000.0)
                            .minus(BaseReserve)
                            .minus(Number(OwnerCount) * OwnerReserve)
                            .decimalPlaces(8)
                            .toNumber();

                        if (availableBalance < 0) {
                            resolve(0);
                        }

                        resolve(availableBalance);
                    } else {
                        reject(new Error('Unable to fetch account balance'));
                    }
                })
                .catch(() => {
                    reject(new Error('Unable to fetch account balance'));
                });
        });
    };

    /**
     * Get account last sequence
     */
    getAccountSequence = (account: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((accountInfo) => {
                    if (!has(accountInfo, 'error') && has(accountInfo, ['account_data', 'Sequence'])) {
                        const { account_data } = accountInfo;
                        resolve(Number(account_data.Sequence));
                    } else {
                        reject(new Error('Unable to fetch account sequence'));
                    }
                })
                .catch(() => {
                    reject(new Error('Unable to fetch account sequence'));
                });
        });
    };

    /**
     * Get account blocker objects
     * Note: should look for marker as it can be not in first page
     */
    getAccountBlockerObjects = async (
        account: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        const resp = await this.getAccountObjects(account, { deletion_blockers_only: true, marker });
        const { account_objects, marker: _marker } = resp;
        if (_marker && _marker !== marker) {
            return this.getAccountBlockerObjects(account, _marker, account_objects.concat(combined));
        }
        return account_objects.concat(combined);
    };

    /**
     * Get account line base on provided peer
     */
    getFilteredAccountLine = async (account: string, peer: Issuer): Promise<LedgerTrustline> => {
        return this.getLedgerEntry({
            ripple_state: { accounts: [account, peer.issuer], currency: peer.currency },
        })
            .then((resp: LedgerEntryResponse) => {
                const { node } = resp as {
                    node: RippleStateLedgerEntry;
                };

                // return undefined if in default state or no ripple state found
                if (
                    !node ||
                    !(
                        node.Flags &
                        LedgerObjectFlags.RippleState[
                            node.HighLimit.issuer === account ? 'lsfHighReserve' : 'lsfLowReserve'
                        ]
                    )
                ) {
                    return undefined;
                }

                return RippleStateToTrustLine(node, account);
            })
            .catch(() => {
                return undefined;
            });
    };

    /**
     * returns all outgoing account lines
     * NOTE: we use account_objects to get account lines as it's more accurate and efficient
     */
    getFilteredAccountLines = async (
        account: string,
        marker?: string,
        combined = [] as LedgerTrustline[],
    ): Promise<LedgerTrustline[]> => {
        return this.getAccountObjects(account, { marker, type: 'state' }).then((resp) => {
            const { account_objects, marker: _marker } = resp as {
                account_objects: RippleStateLedgerEntry[];
                marker?: string;
            };
            // filter lines that are not in default state
            const notInDefaultState = account_objects.filter((node) => {
                return (
                    node.Flags &
                    LedgerObjectFlags.RippleState[
                        node.HighLimit.issuer === account ? 'lsfHighReserve' : 'lsfLowReserve'
                    ]
                );
            });
            // convert RippleState entry to Ledger trustline format
            const accountLinesFormatted = notInDefaultState.map((node) => RippleStateToTrustLine(node, account));

            if (_marker && _marker !== marker) {
                return this.getFilteredAccountLines(account, _marker, accountLinesFormatted.concat(combined));
            }
            return accountLinesFormatted.concat(combined);
        });
    };

    /**
     * Submit signed transaction to the Ledger
     */
    submitTransaction = async (txBlob: string, txHash?: string, failHard = false): Promise<SubmitResultType> => {
        try {
            // get connection details from network service
            const { node, type: networkType, networkId, networkKey } = NetworkService.getConnectionDetails();

            // send event about we are about to submit the transaction
            this.emit('submitTransaction', {
                blob: txBlob,
                hash: txHash,
                network: {
                    id: networkId,
                    node,
                    type: networkType,
                    key: networkKey,
                },
            });

            // submit the tx blob to the ledger
            const submitResult = await NetworkService.send({
                command: 'submit',
                tx_blob: txBlob,
                fail_hard: failHard,
            });

            const { error, error_message, error_exception, engine_result, tx_json, engine_result_message } =
                submitResult;

            this.logger.debug('Submit Result TX:', submitResult);

            // assign hash we received from submitting the transaction
            // this is necessary for verifying the transaction in case of only tx_blob is available
            // create default result
            const result = {
                hash: tx_json?.hash,
                node,
                network: {
                    id: networkId,
                    node,
                    type: networkType,
                    key: networkKey,
                },
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

            // Immediate rejection
            if (startsWith(engine_result, 'tem')) {
                return assign(result, {
                    success: false,
                    engineResult: engine_result,
                    message: engine_result_message,
                });
            }

            // probably successful
            return assign(result, {
                success: true,
                engineResult: engine_result,
                message: engine_result_message,
            });
        } catch (e) {
            // something wrong happened
            return {
                success: false,
                engineResult: 'telFAILED',
                // @ts-ignore
                message: e.message,
                network: {
                    id: undefined,
                    node: undefined,
                    type: undefined,
                    key: undefined,
                },
            };
        }
    };

    /**
     * Verify transaction on Ledger
     */
    verifyTransaction = (transactionId: string): Promise<VerifyResultType> => {
        return new Promise((resolve) => {
            let timeout = undefined as ReturnType<typeof setTimeout>;

            const ledgerListener = () => {
                this.getTransaction(transactionId)
                    .then((tx: any) => {
                        if (tx.validated) {
                            // of event for ledger
                            NetworkService.offEvent('ledger', ledgerListener);

                            // clear timeout
                            if (timeout) {
                                clearTimeout(timeout);
                            }

                            const { TransactionResult } = tx.meta;

                            resolve({
                                success: TransactionResult === 'tesSUCCESS',
                                transaction: tx,
                            });
                        }
                    })
                    .catch(() => {});
            };

            // listen for ledger close events
            NetworkService.onEvent('ledger', ledgerListener);

            // timeout after 30 sec
            timeout = setTimeout(() => {
                NetworkService.offEvent('ledger', ledgerListener);
                resolve({
                    success: false,
                });
            }, 30000);
        });
    };
}

export default new LedgerService();
