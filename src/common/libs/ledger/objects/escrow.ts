import moment from 'moment-timezone';

import { get, has, set, isUndefined } from 'lodash';

import BaseLedgerObject from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';

/* Class ==================================================================== */
class Escrow extends BaseLedgerObject {
    [key: string]: any;

    constructor(object?: any) {
        super(object);
    }

    get Amount(): AmountType {
        const amount = get(this, ['object', 'Amount']);

        if (isUndefined(amount)) return undefined;

        return {
            currency: 'XRP',
            value: new Amount(amount).dropsToXrp(),
        };
    }

    get Destination(): Destination {
        const destination = get(this, ['object', 'Destination'], undefined);
        const destinationTag = get(this, ['object', 'DestinationTag'], undefined);
        const destinationName = get(this, ['object', 'DestinationName'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            name: destinationName,
            address: destination,
            tag: destinationTag,
        };
    }

    set Destination(destination: Destination) {
        if (has(destination, 'name')) {
            set(this, 'object.DestinationName', destination.name);
        }
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
