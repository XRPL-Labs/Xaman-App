/**
 * Socket service
 */
import EventEmitter from 'events';
import { Platform } from 'react-native';
import { XrplClient, ConnectionState } from 'xrpl-client';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { GetAppReadableVersion } from '@common/helpers/device';

import { AppConfig, AppScreens } from '@common/constants';

import AppService, { AppStateStatus, NetStateStatus } from '@services/AppService';
import LoggerService from '@services/LoggerService';
import NavigationService from '@services/NavigationService';

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

    initialize = (coreSettings: CoreSchema) => {
        return new Promise<void>((resolve, reject) => {
            try {
                // get/set default node
                let defaultNode = __DEV__ ? AppConfig.nodes.test[0] : AppConfig.nodes.main[0];

                if (coreSettings && coreSettings.defaultNode) {
                    defaultNode = coreSettings.defaultNode;
                }

                // set default node
                this.setDefaultNode(defaultNode);

                // listen on navigation change event
                NavigationService.on('setRoot', (root: string) => {
                    // we just need to connect to socket when we are in DefaultStack not Onboarding
                    if (root === 'DefaultStack') {
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

    onNodeChange = (url: string, chain: NodeChain) => {
        // if the default node changed
        if (url !== this.node) {
            // change default node
            this.node = url;
            this.chain = chain;
            // reconnect
            this.reconnect();
        }
    };

    isConnected = (): boolean => {
        return this.status === SocketStateStatus.Connected;
    };

    setDefaultNode = (node: string) => {
        let chain = NodeChain.Main;

        // it is a verified type
        if (AppConfig.nodes.main.indexOf(node) > -1) {
            chain = NodeChain.Main;
        } else if (AppConfig.nodes.test.indexOf(node) > -1) {
            chain = NodeChain.Test;
        }

        // THIS IS DURRING BETA
        // if it's main net and the default node is not default node revert
        if (chain === NodeChain.Main && node !== AppConfig.nodes.default) {
            this.node = AppConfig.nodes.default;

            // update the database
            CoreRepository.saveSettings({
                defaultNode: this.node,
            });
        } else {
            this.node = node;
        }
        // set the chain
        this.chain = chain;
    };

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

    close = () => {
        // close current connection
        if (this.connection) {
            this.connection.close();
            this.connection = undefined;
        }
    };

    reconnect = () => {
        try {
            this.logger.debug('Reconnecting socket service...');
            // close current connection
            this.close();
            // reconnect
            this.connect();
        } catch (e) {
            this.logger.error('Reconnect Error', e);
        }
    };

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
        return this.connection.send(payload, { timeoutSeconds: 3 });
    };

    onError = (err: any) => {
        this.logger.error('Socket Error: ', err);
    };

    onConnect = () => {
        // fetch connected node from connection
        const connectedNode = this.connection.getState().server.uri;

        this.logger.debug(`Connected to XRPL  Node ${connectedNode}`);

        // set node and connection
        this.node = connectedNode;

        // change socket status
        this.status = SocketStateStatus.Connected;
        // emit on connect event
        this.emit('connect', this.connection);
    };

    onClose = () => {
        this.status = SocketStateStatus.Disconnected;
        this.logger.warn('Socket Closed');
    };

    onFail = () => {
        if (!this.shownErrorDialog) {
            this.logger.error('Tried all node, unable to connect');
            this.showConnectionProblem();
            this.shownErrorDialog = true;
        }
    };

    onStateChange = (state: ConnectionState) => {
        const { online } = state;

        const reconnected = this.status === SocketStateStatus.Disconnected && online;
        // update current state
        this.status = online ? SocketStateStatus.Connected : SocketStateStatus.Disconnected;
        // if we are connecting again
        if (reconnected) {
            this.emit('connect', this.connection);
        }
    };

    connect = async () => {
        let nodes = [];

        // load node's list base on selected node chain
        if (this.chain === NodeChain.Main) {
            nodes = AppConfig.nodes.main;
        } else {
            nodes = AppConfig.nodes.test;
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

        this.connection.on('online', this.onConnect);
        this.connection.on('offline', this.onClose);
        this.connection.on('round', this.onFail);

        await this.connection.ready();
    };
}

export default new SocketService();
