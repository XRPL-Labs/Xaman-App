import { get, set, has, isUndefined } from 'lodash';

import Amount from '../parser/common/amount';
import LedgerDate from '../parser/common/date';

import BaseLedgerObject from './base';

/* Types ==================================================================== */
import { AmountType, Destination } from '../parser/types';
import { LedgerObjectTypes } from '../types';

/* Class ==================================================================== */
class NFTokenOffer extends BaseLedgerObject {
    public static Type = LedgerObjectTypes.NFTokenOffer as const;
    public readonly Type = NFTokenOffer.Type;

    constructor(object?: any) {
        super(object);
    }

    get Owner(): string {
        return get(this, ['object', 'Owner'], undefined);
    }

    get NFTokenID(): string {
        return get(this, ['object', 'NFTokenID'], undefined);
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

    get Amount(): AmountType {
        const amount = get(this, ['object', 'Amount']);

        if (isUndefined(amount)) return undefined;

        if (typeof amount === 'string') {
            return {
                currency: 'XRP',
                value: new Amount(amount).dropsToXrp(),
            };
        }

        return {
            currency: amount.currency,
            value: new Amount(amount.value, false).toString(),
            issuer: amount.issuer,
        };
    }

    get Date(): any {
        return this.Expiration;
    }

    get Expiration(): string {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }
}

/* Export ==================================================================== */
export default NFTokenOffer;
