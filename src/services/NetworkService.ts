/**
 * Network service
 */

import { isPlainObject, isArray, isString } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';
import Realm from 'realm';

import { Platform } from 'react-native';

import { XrplDefinitions, DefinitionsData } from 'xrpl-accountlib';
import DEFAULT_DEFINITIONS from 'ripple-binary-codec/dist/enums/definitions.json';

import { ServerInfoResponse, XrplClient } from 'xrpl-client';

import CoreRepository from '@store/repositories/core';
import NetworkRepository from '@store/repositories/network';
import { CoreModel, NetworkModel, NodeModel } from '@store/models';
import { NetworkType } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/app';

import { NormalizeFeeDataSet, PrepareTxForHookFee } from '@common/utils/fee';

import { AppScreens, NetworkConfig } from '@common/constants';

import AppService, { AppStateStatus, NetStateStatus } from '@services/AppService';
import NavigationService, { RootType } from '@services/NavigationService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';

/* Types  ==================================================================== */
export enum NetworkStateStatus {
    Connected = 'Connected',
    Connecting = 'Connecting',
    Disconnected = 'Disconnected',
}

export type NetworkServiceEvent = {
    connect: (network: NetworkModel) => void;
    stateChange: (networkStatus: NetworkStateStatus) => void;
    networkChange: (network: NetworkModel) => void;
};

declare interface NetworkService {
    on<U extends keyof NetworkServiceEvent>(event: U, listener: NetworkServiceEvent[U]): this;
    off<U extends keyof NetworkServiceEvent>(event: U, listener: NetworkServiceEvent[U]): this;
    emit<U extends keyof NetworkServiceEvent>(event: U, ...args: Parameters<NetworkServiceEvent[U]>): boolean;
}
/* Service  ==================================================================== */
class NetworkService extends EventEmitter {
    public network: NetworkModel;
    public connection: XrplClient;
    private status: NetworkStateStatus;
    private networkReserve: any;
    private lastNetworkErrorId: Realm.BSON.ObjectId;

    onEvent: (event: string, fn: any) => any;
    offEvent: (event: string, fn: any) => any;

    static TIMEOUT_SECONDS = 40;
    static ORIGIN = `/xaman/${GetAppVersionCode()}/${Platform.OS}`;
    private logger: LoggerInstance;

    constructor() {
        super();

        this.network = undefined;
        this.connection = undefined;
        this.status = NetworkStateStatus.Disconnected;
        this.networkReserve = undefined;
        this.lastNetworkErrorId = undefined;

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

        // send event
        this.emit('stateChange', status);
    };

    /**
     * Returns current connection status
     * @returns {NetworkStateStatus}
     */
    getConnectionStatus = (): NetworkStateStatus => {
        return this.status;
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
        return this.network.nativeAsset.asset;
    };

    /**
     * Get connected network native asset icons
     * @returns {string}
     */
    getNativeAssetIcons = (): { currency: string; asset: string } => {
        return {
            currency: this.network.nativeAsset.icon,
            asset: this.network.nativeAsset.iconSquare,
        };
    };

    /**
     * Get connected network id
     * @returns {number}
     */
    getNetworkId = (): number => {
        return this.network.networkId;
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
    getNetworkDefinitions = (): XrplDefinitions => {
        if (this.network && this.network.definitions) {
            return new XrplDefinitions(<DefinitionsData>this.network.definitions);
        }

        return new XrplDefinitions(DEFAULT_DEFINITIONS);
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
    getAvailableNetworkFee = (
        txJson: any,
    ): Promise<{
        availableFees: { type: string; value: string }[];
        feeHooks: number;
        suggested: string;
    }> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const request = {
                    command: 'fee',
                    tx_blob: PrepareTxForHookFee(txJson, this.network.definitions),
                };

                const feeDataSet = await this.send(request);

                resolve(NormalizeFeeDataSet(feeDataSet));
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
    getConnectionDetails = (): { networkId: number; networkKey: string; node: string; type: NetworkType } => {
        return {
            networkKey: this.network.key,
            networkId: this.network.networkId,
            node: this.network.defaultNode.endpoint,
            type: this.network.type,
        };
    };

    /**
     * Switch network
     * @param network
     */
    switchNetwork = (network: NetworkModel): Promise<void> => {
        return new Promise((resolve, reject) => {
            try {
                // nothing has been changed
                if (network.id.equals(this.network.id) && network.defaultNode === this.network.defaultNode) {
                    return;
                }

                this.logger.debug(
                    `Switch network ${network.name} [id-${network.networkId}][node-${network.defaultNode.endpoint}]`,
                );

                // change network
                this.network = network;

                // update cached reserve
                this.networkReserve = {
                    base: network.baseReserve,
                    owner: network.ownerReserve,
                };

                // set the default network on the store
                CoreRepository.setDefaultNetwork(network);

                // emit the event
                this.emit('networkChange', network);

                // destroy prev connection
                this.destroyConnection();

                // reconnect
                this.connect();

                // resolve
                resolve();
            } catch (error: any) {
                reject(error);
            }
        });
    };

    /**
     * Show's connection problem overlay
     */
    showConnectionProblem = () => {
        Navigator.showOverlay(AppScreens.Overlay.ConnectionIssue);
    };

    /**
     * Attempts to destroy the current socket connection.
     */
    destroyConnection = () => {
        try {
            // destroy the connection if exist
            if (this.connection) {
                this.connection.destroy();
            }

            // set the new connection status
            this.setConnectionStatus(NetworkStateStatus.Disconnected);
        } catch (error) {
            this.logger.error('Unable to destroy the connection', error);
        }
    };

    /**
     * Attempts to close the current socket connection.
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
     * Attempts to reinstate the current socket connection.
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
     * Re-establishes the current network connection.
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
     * Asynchronously sends a payload to the connected node and ensures that the response is valid by
     * matching the network ID.
     *
     * @param {Object} payload - The data object that needs to be sent to the connected node. Should contain an 'id'
     * property or it will be automatically assigned a unique identifier.
     * @returns {Promise<Object>} The response from the node. If the response is an object, it is augmented with
     * the original ID and network ID before being returned.
     * @throws {Error} Throws an error if the network ID in the response does not match the current network ID.
     *
     * @todo refining the error handling to distinguish between network issues and ID mismatches.
     */
    send = async (payload: any): Promise<any> => {
        const payloadWithNetworkId = {
            ...payload,
            id: `${payload.id || uuidv4()}.${this.network?.id.toHexString()}`,
        };

        const res = await this.connection.send(payloadWithNetworkId, {
            timeoutSeconds: NetworkService.TIMEOUT_SECONDS,
        });

        const [resId, resNetworkId] = res.id?.split('.') || [];

        if (resNetworkId !== this.network?.id.toHexString()) {
            throw new Error('Mismatched network ID in response.');
        }

        return typeof res === 'object' ? { ...res, id: resId, __networkId: this.network.networkId } : res;
    };

    /**
     * Updates the network definitions and persists them to the `NetworkRepository`.
     */
    updateNetworkDefinitions = async () => {
        try {
            // include definitions hash if exist in the request
            const request = { command: 'server_definitions' };

            let definitionsHash = '';

            if (this.network.definitions) {
                definitionsHash = this.network.definitions.hash as string;
                Object.assign(request, { hash: definitionsHash });
            }

            const definitionsResp = await this.send(request);

            // validate the response
            if (typeof definitionsResp !== 'object' || 'error' in definitionsResp || !('hash' in definitionsResp)) {
                this.logger.warn('server_definitions got invalid response:', definitionsResp);
                return;
            }

            // nothing has been changed
            if (definitionsResp.hash === definitionsHash) {
                return;
            }

            // validate the response
            const respValidation = {
                TYPES: isPlainObject,
                TRANSACTION_RESULTS: isPlainObject,
                TRANSACTION_TYPES: isPlainObject,
                LEDGER_ENTRY_TYPES: isPlainObject,
                FIELDS: isArray,
                hash: isString,
            } as { [key: string]: (value?: any) => boolean };

            const definitions = {};

            for (const key in respValidation) {
                if (Object.prototype.hasOwnProperty.call(respValidation, key)) {
                    // validate
                    if (respValidation[key](definitionsResp[key]) === false) {
                        this.logger.warn('server_definitions got invalid format:', definitionsResp);
                        return;
                    }
                    // set the key
                    Object.assign(definitions, { [key]: definitionsResp[key] });
                }
            }

            this.logger.debug(`Updating network [${this.network.networkId}] definitions ${definitionsResp.hash} `);

            NetworkRepository.update({
                id: this.network.id,
                definitionsString: JSON.stringify(definitions),
            });
        } catch (error: any) {
            this.logger.error('updateNetworkDefinitions: ', error);
        }
    };

    /**
     * Updates the network's enabled amendments by fetching and persisting them.
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
     * Updates the network reserve state by querying the server for current values and
     * persists any changes locally and to the `NetworkRepository`.
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
     * @param error
     */
    onError = (error: any) => {
        // set connection status
        this.setConnectionStatus(NetworkStateStatus.Disconnected);

        // show error if necessary
        if (!this.network?.id.equals(this.lastNetworkErrorId)) {
            this.showConnectionProblem();
            this.lastNetworkErrorId = this.network.id;
        }

        this.logger.error('Socket Error: ', error || 'Tried all nodes!');
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
        this.emit('connect', this.network);
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
     * Establishes a network connection using predefined or custom nodes.
     *
     * This method initiates the connection by:
     * - Setting the connection status to 'Connecting'.
     * - Determining the nodes to connect based on the network type.
     * - Instantiating a new `XrplClient` with specified nodes and configuration.
     * - Setting up event listeners for various connection states ('online', 'offline', and 'error').
     *
     * @throws Will log an error if connection instantiation fails or event listeners encounter an issue.
     *
     */
    connect = () => {
        // set the connection status to connecting
        this.setConnectionStatus(NetworkStateStatus.Connecting);

        // craft nodes
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

        this.connection.on('online', this.onConnect);
        this.connection.on('offline', this.onClose);
        this.connection.on('error', this.onError);
        // @ts-ignore
        this.connection.on('round', this.onError);
    };
}

export default new NetworkService();
