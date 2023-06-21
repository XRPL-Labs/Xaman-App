/**
 * Network service
 */
import EventEmitter from 'events';
import { Platform } from 'react-native';
import { XrplClient } from 'xrpl-client';

import CoreRepository from '@store/repositories/core';
import { CoreSchema, NetworkSchema, NodeSchema } from '@store/schemas/latest';
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
    public network: NetworkSchema;
    public connection: XrplClient;
    private status: NetworkStateStatus;
    private origin: string;
    private shownErrorDialog: boolean;
    private logger: any;
    onEvent: (event: string, fn: any) => any;
    offEvent: (event: string, fn: any) => any;

    constructor() {
        super();

        this.network = undefined;
        this.connection = undefined;
        this.origin = `/xumm/${GetAppVersionCode()}/${Platform.OS}`;
        this.shownErrorDialog = false;
        this.status = NetworkStateStatus.Disconnected;
        this.logger = LoggerService.createLogger('Network');

        // proxy events
        this.onEvent = (event: string, fn: any) => {
            if (this.connection) {
                return this.connection.addListener(event, fn);
            }
            return undefined;
        };

        // proxy remove event
        this.offEvent = (event: string, fn: any) => {
            if (this.connection) {
                return this.connection.removeListener(event, fn);
            }
            return undefined;
        };
    }

    initialize = (coreSettings: CoreSchema) => {
        return new Promise<void>((resolve, reject) => {
            try {
                // set the network
                this.network = coreSettings.network;

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
     * Get connected network id
     * @returns {number}
     */
    getConnectedNetworkId = () => {
        return this.network.networkId;
    };

    /**
     * Get connection details
     * @returns {object}
     */
    getConnectionDetails = (): { node: string; type: string; networkId: number; key: string } => {
        return {
            key: this.network.key,
            networkId: this.network.networkId,
            node: this.network.defaultNode.node,
            type: this.network.type,
        };
    };

    /**
     * Switch network
     * @param network
     */
    switchNetwork = (network: NetworkSchema) => {
        // nothing has been changed
        if (network.networkId === this.network.networkId && network.defaultNode === this.network.defaultNode) {
            return;
        }

        // log
        this.logger.debug(
            `Switch network ${network.name} [id-${network.networkId}][node-${network.defaultNode.endpoint}]`,
        );

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
    send = (payload: any): any => {
        return this.connection.send(payload, { timeoutSeconds: 40 });
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
        if (connectedNode.endsWith(this.origin)) {
            connectedNode = connectedNode.replace(this.origin, '');
        }

        // change network status
        this.setConnectionStatus(NetworkStateStatus.Connected);

        // log the connection
        this.logger.debug(`Connected to node ${connectedNode} [${publicKey}]`);

        // emit on connect event
        this.emit('connect', this.network.networkId);
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
            nodes = this.network.nodes.map((node: NodeSchema) => {
                // for cluster we add origin
                if (NetworkConfig.clusterEndpoints.includes(node.endpoint)) {
                    return `${node.endpoint}${this.origin}`;
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
            nodes = [`${NetworkConfig.customNodeProxy}/${defaultNode.endpoint}`];
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
