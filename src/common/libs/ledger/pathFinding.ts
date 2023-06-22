/*
   synchronous path_finding
*/

import { flatMap } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

import { NetworkService } from '@services';

import { PathOption, RipplePathFindResponse } from '@common/libs/ledger/types';
import { LedgerAmount } from '@common/libs/ledger/parser/types';

/* Types ==================================================================== */
declare interface LedgerPathFinding {
    on(event: 'expire', listener: () => void): this;

    on(event: string, listener: Function): this;
}

type PaymentOptions = {
    [key: string]: PathOption;
};

type RequestPromise = {
    resolver: (value: PathOption[] | PromiseLike<PathOption[]>) => void;
    rejecter: (reason?: any) => void;
};

/* Constants ==================================================================== */
const RESOLVE_AFTER_SECS = 7000; // seconds before returning the data
const EXPIRE_AFTER_SECS = 60000; // seconds to expire the options

/* Class ==================================================================== */
class LedgerPathFinding extends EventEmitter {
    private resolveTimeout: ReturnType<typeof setTimeout>;
    private expireTimeout: ReturnType<typeof setTimeout>;

    private requestId: string;
    private requestPromise: RequestPromise;
    private paymentOptions: PaymentOptions;

    constructor() {
        super();

        this.resolveTimeout = undefined;
        this.expireTimeout = undefined;

        this.requestId = undefined;
        this.requestPromise = undefined;
        this.paymentOptions = {};
    }

    private handlePathFindEvent = (result: { alternatives: PathOption[]; id: string; full_reply?: boolean }) => {
        const { id, alternatives, full_reply } = result;

        if (!alternatives) {
            return;
        }

        // check if the data is coming for current request
        if (id !== this.requestId) {
            return;
        }

        // parse the options
        this.handlePathOptions(alternatives, full_reply);
    };

    // listen for ledger close events
    private subscribePathFind = () => {
        NetworkService.onEvent('path', this.handlePathFindEvent);
    };

    // listen for ledger close events
    private unsubscribePathFind = () => {
        NetworkService.offEvent('path', this.handlePathFindEvent);
    };

    private handlePathOptions = (options: PathOption[], shouldResolve?: boolean) => {
        options.forEach((option) => {
            const { source_amount } = option;

            if (typeof source_amount === 'string') {
                this.paymentOptions[NetworkService.getNativeAsset()] = option;
            } else if (typeof source_amount === 'object') {
                this.paymentOptions[`${source_amount.issuer}:${source_amount.currency}`] = option;
            }
        });

        if (shouldResolve) {
            this.resolveRequest();
        }
    };

    onRequestExpire = () => {
        // clear payment options
        this.paymentOptions = {};

        // emit expire event
        this.emit('expire');
    };

    resolveRequest = () => {
        // already resolved
        if (!this.requestPromise?.resolver) {
            return;
        }

        // resolve
        this.requestPromise.resolver(flatMap(this.paymentOptions));

        // clear request promise
        this.requestPromise = undefined;

        // cancel path finding request and unsubscribe from events
        this.close();

        // set the timeout for expiry
        if (this.expireTimeout) {
            clearTimeout(this.expireTimeout);
        }
        this.expireTimeout = setTimeout(this.onRequestExpire, EXPIRE_AFTER_SECS);
    };

    startResolveTimeout = () => {
        // clear timeouts if any exist
        if (this.resolveTimeout) {
            clearTimeout(this.resolveTimeout);
        }

        // wait for seconds for the events to catch up
        this.resolveTimeout = setTimeout(() => {
            this.resolveRequest();
        }, RESOLVE_AFTER_SECS);
    };

    request = (amount: LedgerAmount, source: string, destination: string): Promise<PathOption[]> => {
        return new Promise((resolve, reject) => {
            // generate request id
            this.requestId = uuidv4();

            // send socket request
            NetworkService.send({
                id: this.requestId,
                command: 'path_find',
                subcommand: 'create',
                source_account: source,
                destination_account: destination,
                destination_amount: amount,
            })
                .then((response: RipplePathFindResponse) => {
                    const { id, result, error } = response;

                    // request is canceled
                    if (id !== this.requestId) {
                        reject(new Error('CANCELED'));
                        return;
                    }

                    if (error || !result) {
                        reject(error);
                        return;
                    }

                    this.requestPromise = {
                        resolver: resolve,
                        rejecter: reject,
                    };

                    // handle the options from first response
                    const { alternatives } = result;

                    this.handlePathOptions(alternatives);

                    // subscribe to changes
                    this.subscribePathFind();

                    // wait for result from event and resolve after couple of seconds
                    this.startResolveTimeout();
                })
                .catch((e: any) => {
                    reject(e);
                });
        });
    };

    close = () => {
        // check if we are in middle of resolving the request
        if (this.requestPromise?.rejecter) {
            this.requestPromise.rejecter(new Error('CANCELED'));
        }

        this.requestPromise = undefined;

        if (this.resolveTimeout) {
            clearTimeout(this.resolveTimeout);
        }

        if (this.expireTimeout) {
            clearTimeout(this.expireTimeout);
        }

        // clear path options
        this.paymentOptions = {};

        // unsubscribe
        this.unsubscribePathFind();

        // close the request
        NetworkService.send({
            id: this.requestId,
            command: 'path_find',
            subcommand: 'close',
        }).catch(() => {
            // ignore
        });
    };
}

export default LedgerPathFinding;
