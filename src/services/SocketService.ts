/**
 * Socket service
 */
import EventEmitter from 'events';
import { Platform } from 'react-native';
import RippledWsClient from 'rippled-ws-client';
import DeviceInfo from 'react-native-device-info';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { NodeChain } from '@store/types';

import { Navigator } from '@common/helpers/navigator';

import { AppConfig, AppScreens } from '@common/constants';

import AppService from '@services/AppService';
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
    connectionTimeout: number;
    origin: string;
    logger: any;
    status: SocketStateStatus;
    onEvent: (event: string, fn: any) => void;
    onceEvent: (event: string, fn: any) => void;
    offEvent: (event: string, fn: any) => void;

    constructor() {
        super();

        this.node = null;
        this.chain = null;
        this.connection = null;
        this.connectionTimeout = 5;
        this.origin = `https://xumm.app/#${Platform.OS}/${DeviceInfo.getReadableVersion()}`;
        this.status = SocketStateStatus.Disconnected;
        this.logger = LoggerService.createLogger('Socket');

        // proxy events
        this.onEvent = (event: string, fn: any) => {
            return this.connection.addListener(event, fn);
        };

        // proxy remove event
        this.offEvent = (event: string, fn: any) => {
            return this.connection.removeListener(event, fn);
        };
    }

    initialize = (coreSettings: CoreSchema) => {
        return new Promise((resolve, reject) => {
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
                        // listen for net state change
                        AppService.on('netStateChange', (newState: string) => {
                            if (newState === 'Connected') {
                                this.reconnect();
                            } else {
                                this.close();
                            }
                        });
                    }
                });

                return resolve();
            } catch (e) {
                return reject(e);
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
        // if it's main net and the default node is not xrpl.ws revert
        if (chain === NodeChain.Main && node !== 'wss://xrpl.ws') {
            this.node = 'wss://xrpl.ws';

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

    sendPayload = (payload: any) => {
        this.logger.debug('Sending Socket Payload', payload);
        return this.connection.send(payload);
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
        return new Promise((resolve, reject) => {
            // sent tracker
            let sent = false;

            if (this.status === SocketStateStatus.Connected) {
                resolve(this.sendPayload(payload));
                return;
            }

            const senderAfterConnect = () => {
                sent = true;
                resolve(this.sendPayload(payload));
            };
            // wait for the connection to be established
            this.once('connect', senderAfterConnect);

            // timeout sending
            setTimeout(() => {
                if (!sent) {
                    this.removeListener('connect', senderAfterConnect);
                    this.logger.error('Socket Sending Timeout', payload);
                    reject(new Error('Socket Sending Timeout'));
                }
            }, 5000);
        });
    };

    onError = (err: any) => {
        this.logger.error('Socket Error: ', err);
    };

    onConnect = (Connection: any) => {
        this.logger.debug(`Connected to XRPL  Node ${this.node}`);
        this.connection = Connection;

        // change socket status
        this.status = SocketStateStatus.Connected;
        // emit on connect event
        this.emit('connect', Connection);
    };

    onClose = () => {
        this.status = SocketStateStatus.Disconnected;
        this.logger.warn('Socket Closed');
    };

    establish = (node: string) => {
        return new Promise((resolve, reject) => {
            try {
                new RippledWsClient(node, {
                    Origin: this.origin,
                    ConnectTimeout: this.connectionTimeout,
                    MaxConnectTryCount: 1,
                })
                    .then((Connection: any) => {
                        // apply connected node
                        this.node = node;

                        // emit on connect
                        this.onConnect(Connection);

                        Connection.on('error', this.onError);
                        // handle socket errors
                        Connection.on('close', this.onClose);

                        Connection.on('state', (connected: boolean) => {
                            const reconnected = this.status === SocketStateStatus.Disconnected && connected;
                            // update current state
                            this.status = connected ? SocketStateStatus.Connected : SocketStateStatus.Disconnected;
                            // if we are connecting again
                            if (reconnected) {
                                this.emit('connect', Connection);
                            }
                        });

                        resolve();
                    })
                    .catch(() => {
                        this.logger.error(`Unable to connect to node: ${node}`);
                        reject();
                    });
            } catch (e) {
                this.logger.error(`Unable to connect to node: ${node}`, e);
                reject();
            }
        });
    };

    connect = async () => {
        let nodes = [];

        if (this.chain === NodeChain.Main) {
            nodes = AppConfig.nodes.main;
        } else {
            nodes = AppConfig.nodes.test;
        }

        // move preferred node to the first
        nodes.sort((x, y) => {
            return x === this.node ? -1 : y === this.node ? 1 : 0;
        });

        // try to connect to the nodes in the list
        for (let i = 0; i < nodes.length; i++) {
            try {
                await this.establish(nodes[i]);
                // connected close the loop
                break;
            } catch {
                // if this was the last one emit the max exceed event
                if (i === nodes.length - 1) {
                    this.logger.error('Tried all node, unable to connect');
                    this.showConnectionProblem();
                }
            }
        }
    };
}

export default new SocketService();
