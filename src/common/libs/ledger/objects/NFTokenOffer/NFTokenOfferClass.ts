import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class NFTokenOffer extends BaseLedgerObject {
    public static Type = LedgerEntryTypes.NFTokenOffer as const;
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

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
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

    get Date(): any {
        return this.LedgerTime || this.Expiration;
    }

    get Expiration(): string {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get LedgerTime(): string {
        const ledgerTime = get(this, ['object', 'LedgerTime'], undefined);
        if (isUndefined(ledgerTime)) return undefined;
        const ledgerDate = new LedgerDate(ledgerTime);
        return ledgerDate.toISO8601();
    }
}

/* Export ==================================================================== */
export default NFTokenOffer;
