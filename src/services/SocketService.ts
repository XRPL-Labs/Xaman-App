/**
 * Socket service
 */
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';
import RippledWsClient from 'rippled-ws-client';
import DeviceInfo from 'react-native-device-info';
import EventEmitter from 'events';

import { AppConfig } from '@common/constants';
import { CoreRepository } from '@store/repositories';
import { NodeChain } from '@store/types';
import { LoggerService, NavigationService, AppStateService } from '@services';

type BaseCommand = {
    id?: string;
    command: string;
};
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

enum SocketStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

class SocketService extends EventEmitter {
    node: string;
    chain: NodeChain;
    nodeType: 'VERIFIED' | 'CUSTOM';
    connection: any;
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
        this.nodeType = null;
        this.connection = null;
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

        this.onNodeChange = this.onNodeChange.bind(this);
        this.onClose = this.onClose.bind(this);
        this.onError = this.onError.bind(this);
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                // listen on navigation change event
                NavigationService.on('setRoot', (root: string) => {
                    // we just need to connect to socket when we are in DefaultStack not Onboarding
                    if (root === 'DefaultStack') {
                        // get/set default node
                        this.setDefaultNode();

                        // connect to the node
                        this.connect();

                        // listen for net state change
                        AppStateService.on('netStateChange', (newState: string) => {
                            if (newState === 'Connected') {
                                this.reconnect();
                            } else {
                                this.close();
                            }
                        });
                        // disconnect from socket if we are connect and not in the DefaultStack root
                    } else if (this.connection) {
                        this.close();
                    }
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    onNodeChange(url: string, chain: NodeChain, type: 'VERIFIED' | 'CUSTOM') {
        // if the default node changed
        if (url !== this.node) {
            // change default node
            this.node = url;
            this.chain = chain;
            this.nodeType = type;
            // reconnect
            this.reconnect();
        }
    }

    setDefaultNode() {
        const coreSettings = CoreRepository.getSettings();

        // check if node is verified/custom
        const { defaultNode } = coreSettings;

        // it is a verified type
        if (AppConfig.nodes.main.indexOf(defaultNode) > -1) {
            this.chain = NodeChain.Main;
            this.nodeType = 'VERIFIED';
        } else if (AppConfig.nodes.test.indexOf(defaultNode) > -1) {
            this.chain = NodeChain.Test;
            this.nodeType = 'VERIFIED';
        } else {
            this.chain = NodeChain.Unknown;
            this.nodeType = 'CUSTOM';
        }

        // set node
        this.node = defaultNode;
    }

    close() {
        // close current connection
        if (this.connection) {
            if (this.connection.getState().online === true) {
                this.connection.close();
            }
        }
    }

    reconnect() {
        this.logger.debug('Reconnecting socket service...');
        // close current connection
        this.close();
        // reconnect
        this.connect();
    }

    sendPayload = (payload: any) => {
        // assign id to the payload if not exist
        if (!Object.prototype.hasOwnProperty.call(payload, 'id')) {
            Object.assign(payload, { id: uuidv4() });
        }

        this.logger.debug('Sending Socket Payload', payload);
        return this.connection.send(payload);
    };

    send(
        payload:
            | SubscribePayload
            | AccountInfoPayload
            | SubmitPayload
            | AccountTransactionsPayload
            | GetTransactionPayload
            | BookOffersPayload,
    ): any {
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
    }

    onError(err: any) {
        this.logger.error('Socket Error: ', err);
    }

    onConnect(Connection: any) {
        this.logger.debug(`Connected to Rippled Node ${this.node}`);
        this.connection = Connection;

        // change socket status
        this.status = SocketStateStatus.Connected;
        // emit on connect event
        this.emit('connect', Connection);
    }

    onClose() {
        this.status = SocketStateStatus.Disconnected;
        this.logger.error('Socket Closed');
    }

    connect() {
        try {
            new RippledWsClient(this.node, this.origin).then((Connection: any) => {
                this.onConnect(Connection);

                Connection.on('error', this.onError);
                // handle socket errors
                Connection.on('close', this.onClose);

                Connection.on('state', (connected: boolean) => {
                    // if we are connecting again
                    if (this.status === SocketStateStatus.Disconnected && connected) {
                        this.emit('connect', Connection);
                    }
                    this.status = connected ? SocketStateStatus.Connected : SocketStateStatus.Disconnected;
                });
            });
        } catch (e) {
            this.logger.error('Socket Error', e);
        }
    }
}

export default new SocketService();
