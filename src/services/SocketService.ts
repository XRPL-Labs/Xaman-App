/**
 * Socket service
 */
import EventEmitter from 'events';
import { Platform } from 'react-native';
import { XrplClient } from 'xrpl-client';

import CoreRepository from '@store/repositories/core';
import { NodeChain } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { GetAppReadableVersion } from '@common/helpers/device';

import { AppConfig, AppScreens } from '@common/constants';

import AppService, { AppStateStatus, NetStateStatus } from '@services/AppService';
import LoggerService from '@services/LoggerService';
import NavigationService, { RootType } from '@services/NavigationService';

/* Types  ==================================================================== */
enum SocketStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

// events
declare interface SocketService {
    on(event: 'connect', listener: () => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class SocketService extends EventEmitter {
    public node: string;
    public chain: NodeChain;
    public connection: XrplClient;
    private origin: string;
    private status: SocketStateStatus;
    private shownErrorDialog: boolean;
    private logger: any;
    onEvent: (event: string, fn: any) => any;
    offEvent: (event: string, fn: any) => any;

    constructor() {
        super();

        this.node = undefined;
        this.chain = undefined;
        this.connection = undefined;
        this.shownErrorDialog = false;
        this.origin = `https://xumm.app/#${Platform.OS}/${GetAppReadableVersion()}`;
        this.status = SocketStateStatus.Disconnected;
        this.logger = LoggerService.createLogger('Socket');

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

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                const { node, chain } = CoreRepository.getDefaultNode();

                // set the chain
                this.chain = chain;

                // if we are on MainNet and the selected node is not default node revert
                // OR revert to default node if connected to a deprecated node
                if (
                    (chain === NodeChain.Main && node !== AppConfig.nodes.default) ||
                    AppConfig.nodes.deprecated.indexOf(node) > -1
                ) {
                    this.logger.debug('Revert selected node to default node');

                    this.node = AppConfig.nodes.default;
                    this.chain = NodeChain.Main;

                    // update the store
                    CoreRepository.saveSettings({
                        defaultNode: this.node,
                    });
                } else {
                    this.node = node;
                }

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
        this.setConnectionStatus(SocketStateStatus.Disconnected);
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
    setConnectionStatus = (status: SocketStateStatus) => {
        this.status = status;
    };

    /**
     * Returns true if socket is connected
     * @returns {boolean}
     */
    isConnected = (): boolean => {
        return this.status === SocketStateStatus.Connected;
    };

    /**
     * Switch/Store new node
     * @param node new node endpoint
     * @param chain new node chain
     */
    switchNode = (node: string, chain?: NodeChain) => {
        this.logger.debug(`Switch node to ${node} [${chain}]`);

        // store the new node
        const { chain: newChain } = CoreRepository.setDefaultNode(node, chain);

        // if the default node changed
        if (node !== this.node) {
            // change default node
            this.node = node;
            this.chain = newChain;

            // destroy prev connection
            this.destroyConnection();

            // change the connection status
            this.setConnectionStatus(SocketStateStatus.Disconnected);

            // reconnect
            this.connect();
        }
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
            this.logger.debug('Reconnecting socket service...');
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
        if (connectedNode.startsWith(AppConfig.nodes.proxy)) {
            connectedNode = connectedNode.replace(`${AppConfig.nodes.proxy}/`, '');
        }

        // set node and connection
        this.node = connectedNode;

        // change socket status
        this.setConnectionStatus(SocketStateStatus.Connected);

        // log the connection
        this.logger.debug(`Connected to node ${connectedNode} [${this.chain}][${publicKey}]`);

        // emit on connect event
        this.emit('connect', this.connection);
    };

    /**
     * Triggers when socket close
     */
    onClose = () => {
        // change socket status
        this.setConnectionStatus(SocketStateStatus.Disconnected);

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
     * Establish connection to the socket
     */
    connect = () => {
        let nodes: string[];

        // load node's list base on selected node chain
        if (this.chain === NodeChain.Main) {
            nodes = [...AppConfig.nodes.main];
        } else if (this.chain === NodeChain.Test) {
            nodes = [...AppConfig.nodes.test];
        } else if (this.chain === NodeChain.Dev) {
            nodes = [...AppConfig.nodes.dev];
        } else {
            // if not belong to any chain then it's custom node
            // wrap it in proxy
            nodes = [`${AppConfig.nodes.proxy}/${this.node}`];
        }

        // move preferred node to the first
        nodes.sort((x, y) => {
            return x === this.node ? -1 : y === this.node ? 1 : 0;
        });

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

export default new SocketService();
