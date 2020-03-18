/* eslint-disable spellcheck/spell-checker */

/**
 * NTP service
 */

import dgram from 'dgram';
import { Buffer } from 'buffer';
import EventEmitter from 'events';

import { LoggerService } from '@services';

class NTPService extends EventEmitter {
    port: number;
    servers: Array<string>;
    synced: boolean;
    replyTimeout: number;
    lastOffset: number;
    logger: any;

    constructor() {
        super();

        this.port = 123;
        // this.servers = ['test.com', 'test2.com'];
        this.servers = ['time.google.com', 'time.cloudflare.com', 'time.windows.com'];
        this.synced = false;
        this.replyTimeout = 3000;
        this.lastOffset = undefined;
        this.logger = LoggerService.createLogger('NTP');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                return this.SyncNetworkTime()
                    .then(() => {
                        return resolve();
                    })
                    .catch(e => {
                        return reject(e);
                    });
            } catch (e) {
                return reject(e);
            }
        });
    };

    now = () => {
        if (this.lastOffset) {
            const date = new Date();
            date.setUTCMilliseconds(date.getUTCMilliseconds() + this.lastOffset);
            return date;
        }
        return undefined;
    };

    getTime = async () => {
        return new Promise((resolve, reject) => {
            // if sysnced before return current time
            let replied = false;

            if (this.lastOffset) {
                return resolve(this.now());
            }
            // wait for time to sync with network
            const senderAfterSync = () => {
                replied = true;
                return resolve(this.now());
            };
            // wait for the network sync
            this.once('sync', senderAfterSync);

            // timeout getTime
            setTimeout(() => {
                if (!replied) {
                    this.removeListener('sync', senderAfterSync);
                    reject(new Error('Cannot get NTP, Timeout'));
                }
            }, 5000);

            return true;
        });
    };

    SyncNetworkTime = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            for (const s of this.servers) {
                if (!this.synced) {
                    this.logger.debug(`Syncing time with network [${s}]...`);

                    await this.getFromNetwork(s)
                        .then((offset: number) => {
                            this.logger.debug(`NTP Sync success, Network time offset UTC ${offset}`);
                            // set offset
                            this.lastOffset = offset;

                            this.synced = true;
                            // emit on sync event
                            this.emit('sync', offset);

                            resolve();
                        })
                        .catch(e => {
                            this.logger.error('NTP Error', e);
                        });
                }
            }

            if (!this.synced) {
                return reject(
                    new Error('Cannot connect to NTP server, please make sure your are connected to the internet!'),
                );
            }
        });
    };

    getFromNetwork = (url: string): Promise<number> => {
        return new Promise((resolve, reject) => {
            const client = dgram.createSocket('udp4');
            const ntpData = Buffer.alloc(48);

            ntpData[0] = 0x1b;

            for (let i = 1; i < 48; i++) {
                ntpData[i] = 0;
            }

            const timeout = setTimeout(() => {
                client.close();
                return reject(new Error('Timeout'));
            }, this.replyTimeout);

            let errorFired = false;

            client.on('error', err => {
                if (errorFired) {
                    return;
                }
                errorFired = true;
                clearTimeout(timeout);

                reject(err);
            });

            client.send(ntpData, 0, ntpData.length, this.port, url, err => {
                if (err) {
                    if (!errorFired) {
                        clearTimeout(timeout);
                        errorFired = true;
                        client.close();
                    }

                    reject(err);
                    return;
                }

                client.once('message', msg => {
                    clearTimeout(timeout);
                    client.close();
                    // Offset to get to the "Transmit Timestamp" field (time at which the reply
                    // departed the server for the client, in 64-bit timestamp format."
                    const offsetTransmitTime = 40;
                    let intpart = 0;
                    let fractpart = 0;
                    // Get the seconds part
                    for (let i = 0; i <= 3; i++) {
                        intpart = 256 * intpart + msg[offsetTransmitTime + i];
                    }
                    // Get the seconds fraction
                    for (let i = 4; i <= 7; i++) {
                        fractpart = 256 * fractpart + msg[offsetTransmitTime + i];
                    }
                    const milli = intpart * 1000 + (fractpart * 1000) / 0x100000000;
                    // calculate current utc date by ntp
                    const date = new Date('Jan 01 1900 GMT');
                    date.setUTCMilliseconds(date.getUTCMilliseconds() + milli);
                    // offset the device from ntp
                    const offset = +Date.now() - +date;

                    return resolve(offset);
                });
            });
        });
    };
}

export default new NTPService();
