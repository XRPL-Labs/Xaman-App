/**
 * Socket service
 */
import { Platform } from 'react-native';
import RippledWsClient from 'rippled-ws-client';
import DeviceInfo from 'react-native-device-info';
import EventEmitter from 'events';

import { CoreRepository } from '@store/repositories';
import { NodeChain } from '@store/types';
import { LoggerService, AppStateService } from '@services';

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

enum SocketStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

class SocketService extends EventEmitter {
    node: string;
    chain: NodeChain;
    nodeType: 'VERIFIED' | 'CUSTOM';
    connection: any;
    connectionTimeout: 10;
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
                // get/set default node
                this.setDefaultNode();

                // listen for net state change
                AppStateService.on('netStateChange', (newState: string) => {
                    if (newState === 'Connected') {
                        this.reconnect();
                    } else {
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
        const defaultNode = CoreRepository.getDefaultNode();

        this.node = defaultNode.node;
        this.chain = defaultNode.chain;
        this.nodeType = 'VERIFIED';
    }

    close() {
        // close current connection
        if (this.connection) {
            if (this.connection.getState().online === true) {
                this.connection.close();
                this.connection = undefined;
            }
        }
    }

    reconnect() {
        /* eslint-disable-next-line */
        return new Promise((resolve, reject) => {
            try {
                this.logger.debug('Reconnecting socket service...');
                // close current connection
                this.close();
                // reconnect
                this.connect()
                    .then(() => {
                        resolve();
                        return reject();
                    })
                    .catch(() => {
                        return reject();
                    });
            } catch (e) {
                this.logger.error('Reconnect Error', e);
                return reject();
            }
        });
    }

    sendPayload = (payload: any) => {
        this.logger.debug('Sending Socket Payload', payload);
        return this.connection.send(payload);
    };

    send(
        payload:
            | ServerInfoPayload
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
        /* eslint-disable-next-line */
        return new Promise((resolve, reject) => {
            // return resolve if we already connected

            if (this.connection) {
                if (this.connection.getState().online === true) {
                    return resolve();
                }
            }

            try {
                new RippledWsClient(this.node, {
                    Origin: this.origin,
                    ConnectTimeout: this.connectionTimeout,
                    MaxConnectTryCount: 1,
                })
                    .then((Connection: any) => {
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
                        return resolve();
                    })
                    .catch((e: any) => {
                        this.logger.error('Socket connecting Error', e);
                        return reject();
                    });
            } catch (e) {
                this.logger.error('Socket Error', e);
                return reject();
            }
        });
    }
}

export default new SocketService();
