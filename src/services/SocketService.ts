/**
 * Socket service
 */
import EventEmitter from 'events';
import { Platform } from 'react-native';
import { XrplClient } from 'xrpl-client';

import { CoreRepository } from '@store/repositories';
import { NodeChain } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { GetAppReadableVersion } from '@common/helpers/device';

import { AppConfig, AppScreens } from '@common/constants';

import AppService, { AppStateStatus, NetStateStatus } from '@services/AppService';
import LoggerService from '@services/LoggerService';
import NavigationService, { RootType } from '@services/NavigationService';

/* Types  ==================================================================== */
type BaseCommand = {
    id?: string;
    command: string;
};

interface ServerInfoPayload extends BaseCommand {}

interface SubscribePayload extends BaseCommand {
    accounts: string[];
}

interface AccountInfoPayload extends BaseCommand {
    account: string;
    ledger_index?: string;
    signer_lists?: boolean;
}

interface SubmitPayload extends BaseCommand {
    tx_blob: string;
}

interface AccountTransactionsPayload extends BaseCommand {
    account: string;
    ledger_index_min: number;
    ledger_index_max: number;
    binary: boolean;
    limit: number;
    forward?: boolean;
}

interface GetTransactionPayload extends BaseCommand {
    transaction: string;
}

interface BookOffersPayload extends BaseCommand {
    limit?: number;
    taker_pays: any;
    taker_gets: any;
}

interface GatewayBalancesPayload extends BaseCommand {
    strict: boolean;
    hotwallet: Array<string>;
}

interface LedgerEntryPayload extends BaseCommand {
    index: string;
}

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
    node: string;
    chain: NodeChain;
    connection: any;
    origin: string;
    logger: any;
    status: SocketStateStatus;
    shownErrorDialog: boolean;
    onEvent: (event: string, fn: any) => void;
    onceEvent: (event: string, fn: any) => void;
    offEvent: (event: string, fn: any) => void;

    constructor() {
        super();

        this.node = null;
        this.chain = null;
        this.connection = null;
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

                // listen on navigation change event
                NavigationService.on('setRoot', (root: string) => {
                    // we just need to connect to socket when we are in DefaultStack not Onboarding
                    if (root === RootType.DefaultRoot) {
                        // connect to the node
                        this.connect();
                        // listen for net/app state change
                        this.setAppStateListeners();
                    }
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    setAppStateListeners = () => {
        // on net state changed
        AppService.on('netStateChange', (newState: NetStateStatus) => {
            if (newState === NetStateStatus.Connected) {
                this.reconnect();
            } else {
                this.close();
            }
        });

        // on app state changed
        AppService.on('appStateChange', (newState: AppStateStatus, prevState: AppStateStatus) => {
            // reconnect when app comes from idle state to active
            if (newState === AppStateStatus.Active && prevState === AppStateStatus.Inactive) {
                this.reconnect();
            }

            // disconnect socket when app is come to idle state
            if (newState === AppStateStatus.Inactive) {
                this.close();
            }
        });
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

            // destroy current connection and re-connect
            this.connect(true);
        }
    };

    /**
     * Show's connection problem overlay
     */
    showConnectionProblem = () => {
        Navigator.showOverlay(
            AppScreens.Overlay.ConnectionIssue,
            {
                overlay: {
                    handleKeyboardEvents: true,
                },
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            {},
        );
    };

    /**
     * Close socket connection
     */
    close = () => {
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
    reinstate = () => {
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
            this.close();
            // reinstate
            this.reinstate();
        } catch (e) {
            this.logger.error('Unable to reconnect', e);
        }
    };

    /**
     * Sends passed payload to the connected node
     * @param payload
     * @returns {Promise<any>}
     */
    send = (
        payload:
            | ServerInfoPayload
            | SubscribePayload
            | AccountInfoPayload
            | SubmitPayload
            | AccountTransactionsPayload
            | GetTransactionPayload
            | BookOffersPayload
            | GatewayBalancesPayload
            | LedgerEntryPayload,
    ): any => {
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
        let connectedNode = this.connection.getState().server.uri;

        // remove proxy from url if present
        if (connectedNode.startsWith(AppConfig.nodes.proxy)) {
            connectedNode = connectedNode.replace(`${AppConfig.nodes.proxy}/`, '');
        }
        // set node and connection
        this.node = connectedNode;

        this.logger.debug(`Connected to node ${connectedNode} [${this.chain}]`);

        // change socket status
        this.status = SocketStateStatus.Connected;

        // emit on connect event
        this.emit('connect', this.connection);
    };

    /**
     * Triggers when socket close
     */
    onClose = () => {
        this.status = SocketStateStatus.Disconnected;
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

    connect = (clean = false) => {
        // if this is a clean connect
        // clear any old connection
        if (clean && this.connection) {
            this.connection.destroy();
        }

        let nodes = [];

        // load node's list base on selected node chain
        if (this.chain === NodeChain.Main) {
            nodes = AppConfig.nodes.main;
        } else if (this.chain === NodeChain.Test) {
            nodes = AppConfig.nodes.test;
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
