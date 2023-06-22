import moment from 'moment-timezone';
import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import BaseLedgerObject from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerObjectTypes } from '../types';

/* Class ==================================================================== */
class Escrow extends BaseLedgerObject {
    public static Type = LedgerObjectTypes.Escrow as const;
    public readonly Type = Escrow.Type;

    constructor(object?: any) {
        super(object);
    }

    get Amount(): AmountType {
        const amount = get(this, ['object', 'Amount']);

        if (isUndefined(amount)) return undefined;

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

    get Destination(): Destination {
        const destination = get(this, ['object', 'Destination'], undefined);
        const destinationTag = get(this, ['object', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }

    get Condition(): string {
        return get(this, ['object', 'Condition']);
    }

    get CancelAfter(): any {
        const date = get(this, ['object', 'CancelAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get Date(): any {
        return this.FinishAfter || this.CancelAfter;
    }

    get FinishAfter(): any {
        const date = get(this, ['object', 'FinishAfter'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get isExpired(): boolean {
        if (isUndefined(this.CancelAfter)) return false;

        const exp = moment.utc(this.CancelAfter);
        const now = moment().utc();
        return exp.isBefore(now);
    }

    get canFinish(): boolean {
        if (this.isExpired) {
            return false;
        }
        if (isUndefined(this.FinishAfter)) return true;

        const finishAfter = moment.utc(this.FinishAfter);
        const now = moment().utc();

        return now.isAfter(finishAfter);
    }
}

/* Export ==================================================================== */
export default Escrow;
