/**
 * LedgerService service
 * fetching details from ledger - submit/verify transaction
 */
import EventEmitter from 'events';
import BigNumber from 'bignumber.js';
import { has, map, isEmpty, assign, startsWith } from 'lodash';

import { NetworkConfig } from '@common/constants';

import { SubmitResultType, VerifyResultType } from '@common/libs/ledger/types';

import { NetworkType } from '@store/types';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { RippleStateToTrustLine } from '@common/libs/ledger/parser/entry';

import { LedgerEntryFlags } from '@common/constants/flags';

import NetworkService from '@services/NetworkService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';
import {
    AccountInfoRequest,
    AccountLinesTrustline,
    AccountNFToken,
    AccountNFTsRequest,
    AccountObjectsRequest,
    AccountObjectsResponse,
    AccountTxRequest,
    AccountTxResponse,
    GatewayBalancesRequest,
    GatewayBalancesResponse,
    LedgerDataRequest,
    LedgerDataResponse,
    LedgerEntryRequest,
    LedgerEntryResponse,
    ServerInfoRequest,
    TxRequest,
    TxResponse,
    ServerInfoResponse,
    AccountInfoResponse,
    SubmitRequest,
    AccountNFTsResponse,
    SubmitResponse,
    AMMInfoRequest,
    AMMInfoResponse,
} from '@common/libs/ledger/types/methods';
import { LedgerEntry, MPToken, MPTokenIssuance, RippleState, URIToken } from '@common/libs/ledger/types/ledger';
import { IssuedCurrency } from '@common/libs/ledger/types/common';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { SimulateRequest } from '@common/libs/ledger/types/methods/submit';
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';

/* Types  ==================================================================== */
export type LedgerServiceEvent = {
    submitTransaction: (
        blob: string,
        hash: string,
        network: { id: number; node: string; type: NetworkType; key: string },
        feeBlob?: string,
        feeHash?: string,
    ) => void;
};

declare interface LedgerService {
    on<U extends keyof LedgerServiceEvent>(event: U, listener: LedgerServiceEvent[U]): this;
    off<U extends keyof LedgerServiceEvent>(event: U, listener: LedgerServiceEvent[U]): this;
    emit<U extends keyof LedgerServiceEvent>(event: U, ...args: Parameters<LedgerServiceEvent[U]>): boolean;
}

/* Service  ==================================================================== */
class LedgerService extends EventEmitter {
    logger: LoggerInstance;

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
            if (fee?.avg && ledger) {
                return {
                    Fee: fee.avg,
                    LastLedger: ledger.last,
                };
            }
        }

        return {
            Fee: NetworkConfig.netFee,
            LastLedger: 0,
        };
    };

    /**
     * Get ledger entry
     */
    getLedgerEntry = <T>(options?: any) => {
        const request: LedgerEntryRequest = {
            command: 'ledger_entry',
            ledger_index: 'validated',
        };
        if (typeof options === 'object') {
            Object.assign(request, options);
        }
        return NetworkService.send<LedgerEntryRequest, LedgerEntryResponse<T>>(request);
    };

    /**
     * Get account info
     */
    getGatewayBalances = (account: string) => {
        return NetworkService.send<GatewayBalancesRequest, GatewayBalancesResponse>({
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
    getAccountInfo = (account: string) => {
        return NetworkService.send<AccountInfoRequest, AccountInfoResponse>({
            command: 'account_info',
            account,
            ledger_index: 'validated',
            signer_lists: false,
        });
    };

    simulateTransaction = (tx: TransactionJson) => {
        return NetworkService.send<SimulateRequest, SubmitResponse>({
            command: 'simulate',
            tx_json: tx,
        });
    };

    /**
     * Get account objects
     */
    getAccountObjects = (account: string, options?: any) => {
        const request: AccountObjectsRequest = {
            command: 'account_objects',
            account,
            ledger_index: 'validated',
            limit: 200,
        };
        if (typeof options === 'object') {
            Object.assign(request, options);
        }
        return NetworkService.send<AccountObjectsRequest, AccountObjectsResponse>(request);
    };

    /**
     * Get single transaction by providing transaction id
     */
    getTransaction = (txId: string) => {
        return NetworkService.send<TxRequest, TxResponse>({
            command: 'tx',
            transaction: txId,
            binary: false,
        });
    };

    /**
     * Get account transactions
     */
    getTransactions = (account: string, marker?: any, limit?: number) => {
        const request: AccountTxRequest = {
            command: 'account_tx',
            account,
            limit: limit || 200,
            binary: false,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return NetworkService.send<AccountTxRequest, AccountTxResponse>(request);
    };

    /**
     * Retrieves the NFTs associated with the specified account.
     */
    getAccountNFTs = (account: string) => {
        const network = NetworkService.getNetwork();

        if (network.isFeatureEnabled('URIToken')) {
            return this.getAccountURITokens(account);
        }

        return this.getAccountNFTokens(account);
    };

    /**
     * Get account XLS20 NFTokens
     */
    getAccountNFTokens = async (
        account: string,
        marker?: string,
        combined = [] as AccountNFToken[],
    ): Promise<AccountNFToken[]> => {
        const request: AccountNFTsRequest = {
            command: 'account_nfts',
            account,
            limit: 200,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        const resp = await NetworkService.send<AccountNFTsRequest, AccountNFTsResponse>(request);

        if ('error' in resp) {
            this.logger.warn('getAccountNFTokens', resp.error);
            return combined;
        }

        const { account_nfts, marker: _marker } = resp;
        if (_marker && _marker !== marker) {
            return this.getAccountNFTokens(account, _marker, account_nfts.concat(combined));
        }
        return account_nfts.concat(combined);
    };

    /**
     * Get account URI tokens
     */
    getAccountURITokens = async (
        account: string,
        marker?: string,
        combined = [] as URIToken[],
    ): Promise<URIToken[]> => {
        const resp = await this.getAccountObjects(account, { type: 'uri_token', marker });

        if ('error' in resp) {
            this.logger.error('getAccountURITokens', resp.error);
            return combined;
        }

        const { account_objects, marker: _marker } = resp as { account_objects: URIToken[]; marker: string };

        if (_marker && _marker !== marker) {
            return this.getAccountURITokens(account, _marker, account_objects.concat(combined));
        }
        return account_objects.concat(combined);
    };

    /**
     * Retrieves the AMM information for a given amm account.
     *
     * @param {string} issuer - The AMM account address.
     */
    getAMMInfo = (issuer: string) => {
        return NetworkService.send<AMMInfoRequest, AMMInfoResponse>({
            command: 'amm_info',
            amm_account: issuer,
        });
    };

    /**
     * Check if an MPT issuance ID is a vault share and return vault info if so.
     * Returns the vault's Asset info if the MPT is a vault share, otherwise undefined.
     */
    getVaultForMPTIssuance = async (mptIssuanceId: string): Promise<{ asset: any; owner: string } | undefined> => {
        try {
            // Get the issuer from the MPT issuance ID
            const issuer = DecodeMPTokenIssuanceToIssuer(mptIssuanceId);
            if (!issuer) {
                this.logger.debug('getVaultForMPTIssuance: could not decode issuer from', mptIssuanceId);
                return undefined;
            }

            this.logger.debug('getVaultForMPTIssuance: looking up vaults for issuer', issuer);

            // Fetch account objects owned by the issuer (don't filter by type as 'vault' may not be supported)
            const resp = await this.getAccountObjects(issuer);
            if ('error' in resp) {
                this.logger.debug('getVaultForMPTIssuance: error fetching account objects', resp);
                return undefined;
            }

            const { account_objects } = resp as { account_objects: any[] };
            if (!account_objects || account_objects.length === 0) {
                this.logger.debug('getVaultForMPTIssuance: no account objects found');
                return undefined;
            }

            // Log all vault objects found for debugging
            const vaults = account_objects.filter((obj) => obj.LedgerEntryType === 'Vault');
            this.logger.debug('getVaultForMPTIssuance: found vaults', {
                count: vaults.length,
                ids: vaults.map((v) => v.ShareMPTID),
            });

            // Normalize the MPT ID for comparison (uppercase)
            const normalizedMptId = mptIssuanceId.toUpperCase();

            // Find a vault whose ShareMPTID matches the MPT issuance ID
            const vault = vaults.find(
                (obj) => obj.ShareMPTID && obj.ShareMPTID.toUpperCase() === normalizedMptId,
            );

            if (vault) {
                this.logger.debug('getVaultForMPTIssuance: found matching vault', vault.ShareMPTID);
                return {
                    asset: vault.Asset,
                    owner: vault.Owner || vault.Account,
                };
            }

            this.logger.debug('getVaultForMPTIssuance: no matching vault found for', normalizedMptId);
            return undefined;
        } catch (error) {
            this.logger.debug('getVaultForMPTIssuance error', error);
            return undefined;
        }
    };

    /**
     * Get ledger data
     */
    getLedgerData = (marker: string, limit?: number) => {
        const request: LedgerDataRequest = {
            command: 'ledger_data',
            limit: limit || 50,
        };
        if (marker) {
            Object.assign(request, { marker });
        }
        return NetworkService.send<LedgerDataRequest, LedgerDataResponse>(request);
    };

    /**
     * get server info
     */
    getServerInfo = () => {
        return NetworkService.send<ServerInfoRequest, ServerInfoResponse>({
            command: 'server_info',
        });
    };

    /**
     * Get account obligation lines
     */
    getAccountObligations = (account: string): Promise<AccountLinesTrustline[]> => {
        return new Promise((resolve) => {
            this.getGatewayBalances(account)
                .then((resp) => {
                    if ('error' in resp) {
                        this.logger.error('getAccountObligations', resp.error);
                        resolve([]);
                        return;
                    }

                    const { obligations } = resp;

                    if (isEmpty(obligations)) {
                        resolve([]);
                        return;
                    }

                    const obligationsLines = [] as AccountLinesTrustline[];

                    map(obligations, (b, c) => {
                        obligationsLines.push({
                            account,
                            currency: c,
                            balance: new AmountParser(-b, false).toString(),
                            limit: '0',
                            limit_peer: '0',
                            quality_in: 0,
                            quality_out: 0,
                            obligation: true,
                        });
                    });

                    resolve(obligationsLines);
                })
                .catch((error) => {
                    this.logger.error('getAccountObligations', error);
                    return resolve([]);
                });
        });
    };

    /**
     * Get account obligation lines
     */
    getAccountMPTFullDetails = async (
        account: string,
        marker?: string,
        combined = [] as AccountLinesTrustline[],
    ): Promise<AccountLinesTrustline[]> => {
        return NetworkService.send({
            command: 'account_objects',
            account,
            type: 'mptoken',
        }).then(async (resp) => {
            if ('error' in resp) {
                this.logger.error('Unable to get mpt details state', resp.error);
                return combined;
            }

            const { account_objects, marker: _marker } = resp as {
                account_objects: MPToken[];
                marker: string;
            };

            const accountLinesFormatted: AccountLinesTrustline[] = await Promise.all(
                account_objects.map(async (mpt) => {
                    const mpTokenIssuance: MPTokenIssuance = (
                        (await NetworkService.send({
                            command: 'ledger_entry',
                            mpt_issuance: mpt.MPTokenIssuanceID,
                        })) as any
                    )?.node;

                    let amount = Number(mpt?.MPTAmount || 0);
                    let maxAmount = Number(mpTokenIssuance?.MaximumAmount || 0);

                    if (mpTokenIssuance?.AssetScale && Number(mpTokenIssuance?.AssetScale) > 1) {
                        amount /= 10 ** (mpTokenIssuance?.AssetScale || 1);
                        maxAmount /= 10 ** (mpTokenIssuance?.AssetScale || 1);
                    }

                    return {
                        account: DecodeMPTokenIssuanceToIssuer(mpt.MPTokenIssuanceID),
                        currency: mpt.MPTokenIssuanceID,
                        balance: String(amount),
                        limit: String(maxAmount),
                        limit_peer: `${maxAmount}|${JSON.stringify(mpTokenIssuance)}`,
                        no_ripple: true,
                        no_ripple_peer: false,
                        freeze: false,
                        obligation: false,
                        quality_in: 0,
                        quality_out: 0,
                        authorized: true,
                        peer_authorized: true,
                    };
                }),
            );

            if (_marker && _marker !== marker) {
                return this.getAccountMPTFullDetails(account, _marker, accountLinesFormatted.concat(combined));
            }

            return accountLinesFormatted.concat(combined);
        });
    };

    /**
     * Get account transfer rate on percent format
     */
    getAccountTransferRate = (account: string): Promise<number | undefined> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((resp) => {
                    if ('error' in resp) {
                        throw new Error(resp.error);
                    }

                    if (!resp?.account_data?.TransferRate) {
                        resolve(undefined);
                        return;
                    }

                    const { TransferRate } = resp.account_data;
                    const transferFee = new BigNumber(TransferRate).dividedBy(10000000).minus(100).toNumber();
                    resolve(transferFee);
                })
                .catch((error) => {
                    this.logger.error('getAccountTransferRate', error);
                    reject(
                        new Error('Unable to fetch account transfer rate, please check session logs for more info!'),
                    );
                });
        });
    };

    /**
     * Get account available native balance
     */
    getAccountAvailableBalance = (account: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((resp) => {
                    if ('error' in resp) {
                        throw new Error(resp.error);
                    }

                    if (!has(resp, ['account_data', 'Balance']) || !has(resp, ['account_data', 'OwnerCount'])) {
                        throw new Error('no Balance or OwnerCount in account_data');
                    }

                    const { Balance, OwnerCount } = resp.account_data;
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
                })
                .catch((error) => {
                    this.logger.error('getAccountAvailableBalance', error);
                    reject(new Error('Unable to fetch account balance, please check session logs for more info!'));
                });
        });
    };

    /**
     * Get account last sequence
     */
    getAccountSequence = (account: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            this.getAccountInfo(account)
                .then((resp) => {
                    if ('error' in resp) {
                        reject(new Error(resp.error));
                        return;
                    }

                    if (!has(resp, ['account_data', 'Sequence'])) {
                        throw new Error('no Sequence in account_data');
                    }

                    const { account_data } = resp;
                    resolve(Number(account_data.Sequence));
                })
                .catch((error) => {
                    this.logger.error('getAccountSequence', error);
                    reject(new Error('Unable to fetch account sequence, please check session logs for more info!'));
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
        combined = [] as LedgerEntry[],
    ): Promise<LedgerEntry[]> => {
        const resp = await this.getAccountObjects(account, { deletion_blockers_only: true, marker });

        if ('error' in resp) {
            this.logger.error('Unable to get account blocker objects', resp.error);
            return combined;
        }

        const { account_objects, marker: _marker } = resp;

        if (_marker && _marker !== marker) {
            return this.getAccountBlockerObjects(account, _marker, account_objects.concat(combined));
        }
        return account_objects.concat(combined);
    };

    /**
     * Get account line base on provided peer
     */
    getFilteredAccountLine = async (
        account: string,
        peer: IssuedCurrency,
    ): Promise<AccountLinesTrustline | undefined> => {
        if (!peer?.currency || (peer?.currency || '').length === 48) {
            // MPT
            return undefined;
        }

        return this.getLedgerEntry<RippleState>({
            ripple_state: { accounts: [account, peer.issuer], currency: peer.currency },
        })
            .then((resp) => {
                if ('error' in resp) {
                    this.logger.debug('Unable to get account ripple_state entry', resp.error);
                    return undefined;
                }

                const { node } = resp;

                // return undefined if in default state or no ripple state found
                if (
                    !node ||
                    !(
                        node.Flags &
                        LedgerEntryFlags[LedgerEntryTypes.RippleState]![
                            node.HighLimit.issuer === account ? 'lsfHighReserve' : 'lsfLowReserve'
                        ]
                    )
                ) {
                    return undefined;
                }

                return RippleStateToTrustLine(node, account);
            })
            .catch((error) => {
                this.logger.error('getFilteredAccountLine', error);
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
        combined = [] as AccountLinesTrustline[],
    ): Promise<AccountLinesTrustline[]> => {
        return this.getAccountObjects(account, { marker, type: 'state' }).then((resp) => {
            if ('error' in resp) {
                this.logger.error('Unable to get account objects state', resp.error);
                return combined;
            }

            const { account_objects, marker: _marker } = resp as {
                account_objects: RippleState[];
                marker: string;
            };

            // filter lines that are not in default state
            const notInDefaultState = account_objects.filter((node) => {
                return (
                    node.Flags &
                    LedgerEntryFlags[LedgerEntryTypes.RippleState]![
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
    submitTransaction = async (
        txBlob: string,
        txHash?: string,
        failHard?: boolean,
        feeBlob?: string,
        feeHash?: string,
    ): Promise<SubmitResultType> => {
        try {
            // get connection details from network service
            const { node, type: networkType, networkId, networkKey } = NetworkService.getConnectionDetails();

            // send event about we are about to submit the transaction
            this.emit(
                'submitTransaction',
                txBlob,
                txHash ?? '',
                {
                    id: networkId,
                    node,
                    type: networkType,
                    key: networkKey,
                },
                feeBlob,
                feeHash,
            );

            // submit the tx blob to the ledger
            const submitResponse = await NetworkService.send<SubmitRequest, SubmitResponse>({
                command: 'submit',
                tx_blob: txBlob,
                fail_hard: !!failHard,
            });

            // this.logger.debug('--- submitTransaction ---', submitResponse);

            // assign hash we received from submitting the transaction
            // this is necessary for verifying the transaction in case of only tx_blob is available
            // create default result
            const result = {
                hash: txHash,
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
            if ('error' in submitResponse) {
                return assign(result, {
                    success: false,
                    engineResult: submitResponse.error,
                    message:
                        submitResponse.error_message ||
                        submitResponse.error_exception ||
                        submitResponse.error_code ||
                        'NO_ERROR_DESCRIPTION',
                });
            }

            const { engine_result, engine_result_message } = submitResponse;

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
        } catch (error: any) {
            // something wrong happened
            return {
                success: false,
                engineResult: 'telFAILED',
                message: error?.message,
                network: undefined,
            };
        }
    };

    /**
     * Verify transaction on Ledger
     */
    verifyTransaction = (transactionId: string): Promise<VerifyResultType> => {
        return new Promise((resolve) => {
            let timeout: NodeJS.Timeout;

            const ledgerListener = () => {
                this.getTransaction(transactionId)
                    .then((resp) => {
                        if ('error' in resp) {
                            return;
                        }

                        if (resp.validated) {
                            // of event for ledger
                            NetworkService.offEvent('ledger', ledgerListener);

                            // clear timeout
                            if (timeout) {
                                clearTimeout(timeout);
                            }

                            const { TransactionResult } = resp.meta;

                            resolve({
                                success: TransactionResult === 'tesSUCCESS',
                                transaction: resp,
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
