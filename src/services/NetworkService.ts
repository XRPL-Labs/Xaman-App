/**
 * Network service
 */
import EventEmitter from 'events';
import BigNumber from 'bignumber.js';
import { Platform } from 'react-native';
import { ServerInfoResponse, XrplClient } from 'xrpl-client';

import CoreRepository from '@store/repositories/core';
import NetworkRepository from '@store/repositories/network';
import { CoreModel, NetworkModel, NodeModel } from '@store/models';
import { NetworkType } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/app';

import { AppScreens, NetworkConfig } from '@common/constants';

import AppService, { AppStateStatus, NetStateStatus } from '@services/AppService';
import LoggerService from '@services/LoggerService';
import NavigationService, { RootType } from '@services/NavigationService';

/* Types  ==================================================================== */
enum NetworkStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

declare interface NetworkService {
    on(event: 'connect', listener: (networkId: number) => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class NetworkService extends EventEmitter {
    public network: NetworkModel;
    public connection: XrplClient;
    private status: NetworkStateStatus;
    private networkReserve: any;
    private shownErrorDialog: boolean;

    private ledgerListener: any;
    private logger: any;

    onEvent: (event: string, fn: any) => any;
    offEvent: (event: string, fn: any) => any;

    static TIMEOUT_SECONDS = 40;
    static ORIGIN = `/xumm/${GetAppVersionCode()}/${Platform.OS}`;

    constructor() {
        super();

        this.network = undefined;
        this.connection = undefined;
        this.status = NetworkStateStatus.Disconnected;
        this.networkReserve = undefined;
        this.shownErrorDialog = false;

        this.logger = LoggerService.createLogger('Network');

        // proxy on events
        this.onEvent = (event: string, fn: any) => {
            if (this.connection) {
                return this.connection.addListener(event, fn);
            }
            return undefined;
        };

        // proxy off event
        this.offEvent = (event: string, fn: any) => {
            if (this.connection) {
                return this.connection.removeListener(event, fn);
            }
            return undefined;
        };
    }

    initialize = (coreSettings: CoreModel) => {
        return new Promise<void>((resolve, reject) => {
            try {
                // set the current network
                this.network = coreSettings.network;

                // set current network reserve
                this.networkReserve = {
                    base: this.network?.baseReserve,
                    owner: this.network?.ownerReserve,
                };

                this.logger.debug(
                    `Current Network Base/Owner reserve: ${this.networkReserve.base}/${this.networkReserve.owner}`,
                );

                // listen on navigation root change
                NavigationService.on('setRoot', this.onRootChange);

                // resolve
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * on navigation root changed
     */
    onRootChange = (root: RootType) => {
        // we just need to connect to socket when we are in DefaultStack not Onboarding
        if (root === RootType.DefaultRoot) {
            // connect to the node
            this.connect();
            // listen for net/app state change
            this.setAppStateListeners();
        } else {
            // reinstate the service
            // this will destroy the connection and remove the listeners
            this.reinstate();
        }
    };

    /**
     * reinstate service
     */
    reinstate = () => {
        // destroy the connection
        this.destroyConnection();
        // set the new connection status
        this.setConnectionStatus(NetworkStateStatus.Disconnected);
        // remove listeners
        this.removeAppStateListeners();
    };

    setAppStateListeners = () => {
        // on net state changed
        AppService.addListener('netStateChange', this.onNetStateChange);
        // on app state changed
        AppService.addListener('appStateChange', this.onAppStateChange);
    };

    removeAppStateListeners = () => {
        AppService.removeListener('netStateChange', this.onNetStateChange);

        AppService.removeListener('appStateChange', this.onAppStateChange);
    };

    /**
     * On network state changes
     */
    onNetStateChange = (newState: NetStateStatus) => {
        // if new network state is connected, reconnect the socket
        if (newState === NetStateStatus.Connected) {
            this.reconnect();
        } else {
            // no network connection, close the connection
            this.closeConnection();
        }
    };

    /**
     * on AppState change
     */
    onAppStateChange = (newState: AppStateStatus, prevState: AppStateStatus) => {
        // reconnect when app comes from idle state to active
        if (newState === AppStateStatus.Active && prevState === AppStateStatus.Inactive) {
            this.reconnect();
        }

        // disconnect socket when app is come to idle state
        if (newState === AppStateStatus.Inactive) {
            this.closeConnection();
        }
    };

    /**
     * Set current connection state
     */
    setConnectionStatus = (status: NetworkStateStatus) => {
        this.status = status;
    };

    /**
     * Returns true if socket is connected
     * @returns {boolean}
     */
    isConnected = (): boolean => {
        return this.status === NetworkStateStatus.Connected;
    };

    /**
     * Get connected network nativeAsset
     * @returns {string}
     */
    getNativeAsset = (): string => {
        return this.network.nativeAsset;
    };

    /**
     * Get connected network id
     * @returns {number}
     */
    getNetworkId = (): number => {
        return this.network.id;
    };

    /**
     * Get connected network instance
     * @returns {NetworkModel}
     */
    getNetwork = (): NetworkModel => {
        return this.network;
    };

    /**
     * Get current network definitions
     */
    getNetworkDefinitions = (): any => {
        if (this.network && this.network.definitions) {
            return this.network.definitions;
        }

        return undefined;
    };

    /**
     * Get current network base and owner reserve
     */
    getNetworkReserve = (): { BaseReserve: number; OwnerReserve: number } => {
        const { base, owner } = this.networkReserve;

        return {
            BaseReserve: base,
            OwnerReserve: owner,
        };
    };

    /**
     * Get available fees on network base on the load
     * NOTE: values are in drop
     */
    getAvailableNetworkFee = (): Promise<any> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const feeDataSet = await this.send({ command: 'fee' });

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

    /**
     * Get connection details
     * @returns {object}
     */
    getConnectionDetails = (): { networkId: number; networkKey: string; node: string; type: string } => {
        return {
            networkKey: this.network.key,
            networkId: this.network.id,
            node: this.network.defaultNode.endpoint,
            type: this.network.type,
        };
    };

    /**
     * Switch network
     * @param network
     */
    switchNetwork = (network: NetworkModel) => {
        // nothing has been changed
        if (network.id === this.network.id && network.defaultNode === this.network.defaultNode) {
            return;
        }

        // log
        this.logger.debug(`Switch network ${network.name} [id-${network.id}][node-${network.defaultNode.endpoint}]`);

        // set the default network on the store
        CoreRepository.setDefaultNetwork(network);

        // change network
        this.network = network;

        // destroy prev connection
        this.destroyConnection();

        // change the connection status
        this.setConnectionStatus(NetworkStateStatus.Disconnected);

        // reconnect
        this.connect();
    };

    /**
     * Show's connection problem overlay
     */
    showConnectionProblem = () => {
        Navigator.showOverlay(AppScreens.Overlay.ConnectionIssue);
    };

    /**
     * Destroy the connection
     */
    destroyConnection = () => {
        try {
            if (this.connection) {
                this.connection.destroy();
            }
        } catch (e) {
            this.logger.error('Unable to destroy the connection', e);
        }
    };

    /**
     * Close socket connection
     */
    closeConnection = () => {
        try {
            if (this.connection) {
                this.connection.close();
            }
        } catch (e) {
            this.logger.error('Unable to close the connection', e);
        }
    };

    /**
     * Reinstate current socket connection
     */
    reinstateConnection = () => {
        try {
            if (this.connection) {
                this.connection.reinstate();
            }
        } catch (e) {
            this.logger.error('Unable to reinstate the connection', e);
        }
    };

    /**
     * Reconnect current connection
     */
    reconnect = () => {
        try {
            this.logger.debug('Reconnecting network service...');
            // close current connection
            this.closeConnection();
            // reinstate
            this.reinstateConnection();
        } catch (e) {
            this.logger.error('Unable to reconnect', e);
        }
    };

    /**
     * Sends passed payload to the connected node
     * @param payload
     * @returns {Promise<any>}
     */
    send = (payload: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            this.connection
                .send(payload, { timeoutSeconds: NetworkService.TIMEOUT_SECONDS })
                .then((res) => {
                    if (typeof res === 'object') {
                        resolve({
                            ...res,
                            networkId: this.network.id,
                        });
                        return;
                    }

                    resolve(res);
                })
                .catch(reject);
        });
    };

    /**
     * Update network definitions
     */
    updateNetworkDefinitions = () => {
        // include definitions hash if exist in the request
        const request = {
            command: 'server_definitions',
        };

        let definitionsHash = '';

        if (this.network.definitions) {
            definitionsHash = this.network.definitions.hash as string;
            Object.assign(request, { hash: definitionsHash });
        }

        this.send(request)
            .then(async (resp: any) => {
                // an error happened
                if ('error' in resp) {
                    // ignore
                    return;
                }

                // nothing has been changed
                if (resp?.hash === definitionsHash) {
                    return;
                }

                // remove unnecessary fields
                delete resp.__command;
                delete resp.__replyMs;

                NetworkRepository.update({
                    id: this.network.id,
                    definitionsString: JSON.stringify(resp),
                });
            })
            .catch((error: any) => {
                this.logger.error(error);
            });
    };

    /**
     * Update network enabled amendments
     */
    updateNetworkFeatures = () => {
        this.send({
            command: 'ledger_entry',
            index: '7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4',
        })
            .then(async (resp: any) => {
                // ignore if error happened
                if ('error' in resp || !Array.isArray(resp?.node?.Amendments)) {
                    return;
                }

                // persist the details
                NetworkRepository.update({
                    id: this.network.id,
                    amendments: resp.node.Amendments,
                });
            })
            .catch((error: any) => {
                this.logger.error(error);
            });
    };

    /**
     * Update network reserve state
     */
    updateNetworkReserve = () => {
        this.send({ command: 'server_info' })
            .then(async (resp: ServerInfoResponse) => {
                // ignore if error happened
                if ('error' in resp || typeof resp?.info?.validated_ledger !== 'object') {
                    return;
                }

                const { reserve_base_xrp, reserve_inc_xrp } = resp.info.validated_ledger;
                const { base, owner } = this.networkReserve;

                if (reserve_base_xrp !== base || reserve_inc_xrp !== owner) {
                    this.logger.debug(`Network Base/Owner reserve changed to ${reserve_base_xrp}/${reserve_inc_xrp}`);

                    // store the changes locally
                    this.networkReserve = {
                        base: reserve_base_xrp,
                        owner: reserve_inc_xrp,
                    };

                    // persist new network base/owner reserve
                    NetworkRepository.update({
                        id: this.network.id,
                        baseReserve: reserve_base_xrp,
                        ownerReserve: reserve_inc_xrp,
                    });
                }
            })
            .catch((error: any) => {
                this.logger.error(error);
            });
    };

    /**
     * Logs socket errors
     * @param err
     */
    onError = (err: any) => {
        this.logger.error('Socket Error: ', err);
    };

    /**
     * Triggers when socket connected
     */
    onConnect = () => {
        // fetch connected node from connection
        const { uri, publicKey } = this.connection.getState().server;

        let connectedNode = uri;

        // remove proxy from url if present
        if (connectedNode.startsWith(NetworkConfig.customNodeProxy)) {
            connectedNode = connectedNode.replace(`${NetworkConfig.customNodeProxy}/`, '');
        }

        // remove path from cluster node
        if (connectedNode.endsWith(NetworkService.ORIGIN)) {
            connectedNode = connectedNode.replace(NetworkService.ORIGIN, '');
        }

        // change network status
        this.setConnectionStatus(NetworkStateStatus.Connected);

        // log the connection
        this.logger.debug(`Connected to node ${connectedNode} [${publicKey}]`);

        // run post connect functions
        [this.updateNetworkReserve, this.updateNetworkDefinitions, this.updateNetworkFeatures].forEach((fn) => fn());

        // emit on connect event
        this.emit('connect', this.network.id);
    };

    /**
     * Triggers when socket close
     */
    onClose = () => {
        // change socket status
        this.setConnectionStatus(NetworkStateStatus.Disconnected);

        // log that socked is closed
        this.logger.warn('Socket closed');
    };

    /**
     * Triggers when unable to connect to any node
     */
    onFail = () => {
        if (!this.shownErrorDialog) {
            this.logger.error('Tried all node, unable to connect');
            this.showConnectionProblem();
            this.shownErrorDialog = true;
        }
    };

    /**
     * Establish connection to the network
     */
    connect = () => {
        let nodes: string[];

        // get default node for selected network
        const { defaultNode } = this.network;

        // for MainNet we add the list of all nodes for fail over
        if (this.network.type === NetworkType.Main) {
            nodes = this.network.nodes.map((node: NodeModel) => {
                // for cluster, we add origin
                if (NetworkConfig.clusterEndpoints.includes(node.endpoint)) {
                    return `${node.endpoint}${NetworkService.ORIGIN}`;
                }
                return node.endpoint;
            });

            // move preferred node to the first
            nodes.sort((x, y) => {
                return x === defaultNode.endpoint ? -1 : y === defaultNode.endpoint ? 1 : 0;
            });
        } else if (this.network.type === NetworkType.Custom) {
            // wrap in proxy if the network type is custom
            nodes = [`${NetworkConfig.customNodeProxy}/${defaultNode.endpoint}`];
        } else {
            nodes = [`${defaultNode.endpoint}`];
        }

        this.connection = new XrplClient(nodes, {
            maxConnectionAttempts: 3,
            assumeOfflineAfterSeconds: 9,
            connectAttemptTimeoutSeconds: 3,
        });

        this.connection.on('error', this.onError);
        this.connection.on('online', this.onConnect);
        this.connection.on('offline', this.onClose);
        this.connection.on('round', this.onFail);
    };
}

export default new NetworkService();
