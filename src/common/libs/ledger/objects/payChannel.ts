import moment from 'moment-timezone';
import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

import BaseLedgerObject from './base';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerObjectTypes } from '../types';

/* Class ==================================================================== */
class PayChannel extends BaseLedgerObject {
    public static Type = LedgerObjectTypes.PayChannel as const;
    public readonly Type = PayChannel.Type;

    constructor(object?: any) {
        super(object);
    }

    get Amount(): AmountType {
        const amount = get(this, ['object', 'Amount'], undefined);

        if (!amount) {
            return undefined;
        }

        if (typeof amount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(amount).dropsToNative(),
            };
        }

        return {
            currency: amount.currency,
            value: amount.value,
            issuer: amount.issuer,
        };
    }

    get Balance(): AmountType {
        const balance = get(this, ['object', 'Balance'], undefined);

        if (!balance) {
            return undefined;
        }

        if (typeof balance === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(balance).dropsToNative(),
            };
        }

        return {
            currency: balance.currency,
            value: balance.value,
            issuer: balance.issuer,
        };
    }

    get Destination(): Destination {
        const destination = get(this, ['object', 'Destination'], undefined);
        const destinationTag = get(this, ['object', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }

    get DestinationNode(): string {
        return get(this, ['object', 'DestinationNode'], undefined);
    }

    get PublicKey(): string {
        return get(this, ['object', 'PublicKey'], undefined);
    }

    get Date(): any {
        return this.Expiration;
    }

    get Expiration(): any {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get CancelAfter(): string {
        const date = get(this, ['object', 'CancelAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get SettleDelay(): number {
        return get(this, ['object', 'SettleDelay'], undefined);
    }

    get isExpired(): boolean {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default PayChannel;
