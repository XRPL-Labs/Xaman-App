/**
 * LedgerService service
 * fetching details from XRPL ledger - submit/verify transaction
 */
import BigNumber from 'bignumber.js';
import moment from 'moment-timezone';
import { has, map, isEmpty, assign, startsWith } from 'lodash';

import { CoreSchema } from '@store/schemas/latest';
import CoreRepository from '@store/repositories/core';

import {
    LedgerMarker,
    SubmitResultType,
    VerifyResultType,
    AccountTxResponse,
    GatewayBalancesResponse,
    AccountInfoResponse,
    AccountObjectsResponse,
    FeeResponse,
    LedgerTrustline,
    LedgerEntryResponse,
    RippleStateLedgerEntry,
    LedgerEntriesTypes,
} from '@common/libs/ledger/types';

import { Issuer } from '@common/libs/ledger/parser/types';
import { Amount } from '@common/libs/ledger/parser/common';
import { RippleStateToTrustLine } from '@common/libs/ledger/parser/entry';

import { LedgerObjectFlags } from '@common/libs/ledger/parser/common/flags/objectFlags';

import SocketService from '@services/SocketService';
import LoggerService from '@services/LoggerService';
import { AppConfig } from '@common/constants';

/* Service  ==================================================================== */
class LedgerService {
    networkReserve: any;
    logger: any;
    ledgerListener: any;

    constructor() {
        this.networkReserve = undefined;

        this.logger = LoggerService.createLogger('Ledger');
    }

    initialize = (coreSettings: CoreSchema) => {
        return new Promise<void>((resolve, reject) => {
            try {
                // set default network reserve base on prev values
                const { baseReserve, ownerReserve } = coreSettings;

                this.networkReserve = {
                    base: baseReserve,
                    owner: ownerReserve,
                };

                this.logger.debug(`Current Network Base/Owner reserve: ${baseReserve}/${ownerReserve}`);

                // on socket service connect set ledger listener if not set
                SocketService.on('connect', this.setLedgerListener);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Get network base and owner reserve
     */
    getNetworkReserve = (): { BaseReserve: number; OwnerReserve: number } => {
        const { base, owner } = this.networkReserve;

        return {
            BaseReserve: base,
            OwnerReserve: owner,
        };
    };

    /**
     * Get Current ledger status
     */
    getLedgerStatus = (): { Fee: number; LastLedger: number } => {
        if (SocketService.connection) {
            const { fee, ledger } = SocketService.connection.getState();
            return {
                Fee: fee.avg,
                LastLedger: ledger.last,
            };
        }

        return {
            Fee: AppConfig.network.netFee,
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
        return SocketService.send(request);
    };

    /**
     * get ledger fee info
     */
    getLedgerFee = (): Promise<FeeResponse> => {
        return SocketService.send({ command: 'fee' });
    };

    /**
     * Get account info
     */
    getGatewayBalances = (account: string): Promise<GatewayBalancesResponse> => {
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
    getAccountInfo = (account: string): Promise<AccountInfoResponse> => {
        return SocketService.send({
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
        return SocketService.send(request);
    };

    /**
     * Get single transaction by providing transaction id
     */
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
            limit: limit || 50,
            binary: false,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return SocketService.send(request);
    };

    /**
     * Get account NFTs
     */
    getAccountNFTs = (account: string, marker?: string, limit?: number) => {
        const request = {
            command: 'account_nfts',
            account,
            limit: limit || 200,
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
     * Get available fees on network base on the load
     * NOTE: values are in drop
     */
    getAvailableNetworkFee = (): Promise<any> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const feeDataSet = await this.getLedgerFee();

                // set the suggested fee base on queue percentage
                const { current_queue_size, max_queue_size } = feeDataSet;
                const queuePercentage = new BigNumber(current_queue_size).dividedBy(max_queue_size);

                const suggestedFee = queuePercentage.isEqualTo(1)
                    ? 'feeHigh'
                    : queuePercentage.isEqualTo(0)
                    ? 'feeLow'
                    : 'feeMedium';

                // set the drops values to BigNumber instance
                const minimumFee = new BigNumber(feeDataSet.drops.minimum_fee)
                    .multipliedBy(1.5)
                    .integerValue(BigNumber.ROUND_HALF_FLOOR);
                const medianFee = new BigNumber(feeDataSet.drops.median_fee);
                const openLedgerFee = new BigNumber(feeDataSet.drops.open_ledger_fee);

                // calculate fees
                const feeLow = BigNumber.minimum(
                    BigNumber.maximum(
                        minimumFee,
                        BigNumber.maximum(medianFee, openLedgerFee).dividedBy(500),
                    ).integerValue(BigNumber.ROUND_HALF_CEIL),
                    new BigNumber(1000),
                ).toNumber();

                const feeMedium = BigNumber.minimum(
                    queuePercentage.isGreaterThan(0.1)
                        ? minimumFee
                              .plus(medianFee)
                              .plus(openLedgerFee)
                              .dividedBy(3)
                              .integerValue(BigNumber.ROUND_HALF_CEIL)
                        : queuePercentage.isEqualTo(0)
                        ? BigNumber.maximum(minimumFee.multipliedBy(10), BigNumber.minimum(minimumFee, openLedgerFee))
                        : BigNumber.maximum(
                              minimumFee.multipliedBy(10),
                              minimumFee.plus(medianFee).dividedBy(2).integerValue(BigNumber.ROUND_HALF_CEIL),
                          ),

                    new BigNumber(feeLow).multipliedBy(15),
                    new BigNumber(10000),
                ).toNumber();

                const feeHigh = BigNumber.minimum(
                    BigNumber.maximum(
                        minimumFee.multipliedBy(10),
                        BigNumber.maximum(medianFee, openLedgerFee)
                            .multipliedBy(1.1)
                            .integerValue(BigNumber.ROUND_HALF_CEIL),
                    ),
                    new BigNumber(100000),
                ).toNumber();

                resolve({
                    availableFees: [
                        {
                            type: 'low',
                            value: feeLow,
                            suggested: suggestedFee === 'feeLow',
                        },
                        {
                            type: 'medium',
                            value: feeMedium,
                            suggested: suggestedFee === 'feeMedium',
                        },
                        {
                            type: 'high',
                            value: feeHigh,
                            suggested: suggestedFee === 'feeHigh',
                        },
                    ],
                });
            } catch (e) {
                this.logger.warn('Unable to calculate available network fees:', e);
                reject(new Error('Unable to calculate available network fees!'));
            }
        });
    };

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
     * Get account blocker objects
     * Note: should look for marker as it can be not in first page
     */
    getAccountBlockerObjects = (
        account: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        return this.getAccountObjects(account, { deletion_blockers_only: true, marker }).then((resp) => {
            const { account_objects, marker: _marker } = resp;
            if (_marker && _marker !== marker) {
                return this.getAccountBlockerObjects(account, _marker, account_objects.concat(combined));
            }
            return account_objects.concat(combined);
        });
    };

    /**
     * Get account line base on provided peer
     */
    getFilteredAccountLine = (account: string, peer: Issuer): Promise<LedgerTrustline> => {
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
     * Submit signed transaction to the XRP Ledger
     */
    submitTransaction = async (tx_blob: string, fail_hard = false): Promise<SubmitResultType> => {
        try {
            const submitResult = await SocketService.send({
                command: 'submit',
                tx_blob,
                fail_hard,
            });

            const { error, error_message, error_exception, engine_result, tx_json, engine_result_message } =
                submitResult;

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

            // Immediate rejection
            if (startsWith(engine_result, 'tem')) {
                return Object.assign(result, {
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
                node: SocketService.node,
                nodeType: SocketService.chain,
            };
        }
    };

    /**
     * Verify transaction on XRPL
     */
    verifyTransaction = (transactionId: string): Promise<VerifyResultType> => {
        return new Promise((resolve) => {
            let timeout = undefined as ReturnType<typeof setTimeout>;

            const ledgerListener = () => {
                this.getTransaction(transactionId)
                    .then((tx: any) => {
                        if (tx.validated) {
                            // of event for ledger
                            SocketService.offEvent('ledger', ledgerListener);

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
            SocketService.onEvent('ledger', ledgerListener);

            // timeout after 30 sec
            timeout = setTimeout(() => {
                SocketService.offEvent('ledger', ledgerListener);
                resolve({
                    success: false,
                });
            }, 30000);
        });
    };

    /**
     * Set transaction listener if not set
     */
    setLedgerListener = () => {
        if (this.ledgerListener) {
            SocketService.offEvent('ledger', this.updateNetworkReserve);
        }
        this.ledgerListener = SocketService.onEvent('ledger', this.updateNetworkReserve);
    };

    /**
     * Update network reserve
     */
    updateNetworkReserve = (ledger: { reserve_base: number; reserve_inc: number }) => {
        const { reserve_base, reserve_inc } = ledger;

        const reserveBase = new BigNumber(reserve_base).dividedBy(1000000.0).toNumber();
        const reserveOwner = new BigNumber(reserve_inc).dividedBy(1000000.0).toNumber();

        if (reserveBase && reserveOwner) {
            const { base, owner } = this.networkReserve;

            if (reserveBase !== base || reserveOwner !== owner) {
                this.logger.debug(`Network Base/Owner reserve changed to ${reserveBase}/${reserveOwner}`);
                this.networkReserve = {
                    base: reserveBase,
                    owner: reserveOwner,
                };

                // persist settings
                CoreRepository.saveSettings({
                    baseReserve: reserveBase,
                    ownerReserve: reserveOwner,
                });
            }
        }
    };
}

export default new LedgerService();
