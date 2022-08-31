/*
   synchronous path_finding
*/

import { flatMap } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

import { SocketService } from '@services';

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

/* Constants ==================================================================== */
const RESOLVE_AFTER_SECS = 20000; // seconds before returning the data
const EXPIRE_AFTER_SECS = 60000; // seconds to expire the options

/* Class ==================================================================== */
class LedgerPathFinding extends EventEmitter {
    private readonly amount: LedgerAmount;
    private readonly source: string;
    private readonly destination: string;
    private readonly requestId: string;
    private paymentOptions: PaymentOptions;
    private resolveTimeout: NodeJS.Timeout;
    private expireTimeout: NodeJS.Timeout;
    private resolver: (value: PathOption[] | PromiseLike<PathOption[]>) => void;

    constructor(amount: LedgerAmount, source: string, destination: string) {
        super();

        this.amount = amount;
        this.source = source;
        this.destination = destination;
        this.requestId = uuidv4();

        this.resolveTimeout = undefined;
        this.expireTimeout = undefined;

        this.paymentOptions = {};
    }

    private handlePathFindEvent = (result: { alternatives: PathOption[]; id: string; full_reply?: boolean }) => {
        const { alternatives, full_reply, id } = result;

        // check if the data is coming for this request
        if (id !== this.requestId) {
            return;
        }

        // parse the options
        this.handlePathOptions(alternatives, full_reply);
    };

    private subscribePathFind = () => {
        // listen for ledger close events
        SocketService.onEvent('path', this.handlePathFindEvent);
    };

    private unsubscribePathFind = () => {
        // listen for ledger close events
        SocketService.offEvent('path', this.handlePathFindEvent);
    };

    private handlePathOptions = (options: PathOption[], shouldResolve?: boolean) => {
        options.forEach((option) => {
            const { source_amount } = option;

            if (typeof source_amount === 'string') {
                this.paymentOptions.XRP = option;
            } else if (typeof source_amount === 'object') {
                this.paymentOptions[`${source_amount.issuer}:${source_amount.currency}`] = option;
            }
        });

        if (shouldResolve) {
            this.onRequestResolve();
        }
    };

    onRequestExpire = () => {
        // clear payment options
        this.paymentOptions = {};

        // emit expire event
        this.emit('expire');
    };

    onRequestResolve = () => {
        // already resolved
        if (!this.resolver) {
            return;
        }

        // resolve
        this.resolver(flatMap(this.paymentOptions));
        this.resolver = undefined;

        // cancel path finding request and unsubscribe from events
        this.cancel();
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
            this.onRequestResolve();
        }, RESOLVE_AFTER_SECS);
    };

    request = (): Promise<PathOption[]> => {
        return new Promise((resolve, reject) => {
            SocketService.send({
                id: this.requestId,
                command: 'path_find',
                subcommand: 'create',
                source_account: this.source,
                destination_account: this.destination,
                destination_amount: this.amount,
            })
                .then((response: RipplePathFindResponse) => {
                    const { error, result } = response;

                    if (error || !result) {
                        reject(error);
                        return;
                    }

                    // handle the options from first response
                    const { alternatives } = result;
                    this.handlePathOptions(alternatives);

                    // subscribe to changes
                    this.subscribePathFind();

                    this.resolver = resolve;

                    // wait for result from event and resolve after couple of seconds
                    this.startResolveTimeout();
                })
                .catch((e: any) => {
                    reject(e);
                });
        });
    };

    cancel = () => {
        if (this.resolveTimeout) {
            clearTimeout(this.resolveTimeout);
        }

        if (this.expireTimeout) {
            clearTimeout(this.expireTimeout);
        }

        this.unsubscribePathFind();

        SocketService.send({
            id: this.requestId,
            command: 'path_find',
            subcommand: 'close',
        }).catch(() => {
            // ignore
        });
    };
}

export default LedgerPathFinding;
