import moment from 'moment-timezone';

import { get, isUndefined } from 'lodash';

import BaseLedgerObject from './base';
import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

/* Types ==================================================================== */
import { AmountType, Account, Destination } from '../parser/types';

/* Class ==================================================================== */
class Escrow extends BaseLedgerObject {
    [key: string]: any;

    constructor(object?: any) {
        super(object);
    }

    get Account(): Account {
        const source = get(this, ['object', 'Account'], undefined);
        const sourceTag = get(this, ['object', 'SourceTag'], undefined);
        const sourceName = get(this, ['object', 'AccountLabel'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            name: sourceName,
            address: source,
            tag: sourceTag,
        };
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
