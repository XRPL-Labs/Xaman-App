import moment from 'moment-timezone';
import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseLedgerObject from '@common/libs/ledger/objects/BaseLedgerObject';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class Check extends BaseLedgerObject {
    public static Type = LedgerEntryTypes.Check as const;
    public readonly Type = Check.Type;

    constructor(object?: any) {
        super(object);
    }

    get SendMax(): AmountType {
        const sendMax = get(this, ['object', 'SendMax'], undefined);

        if (!sendMax) {
            return undefined;
        }

        if (typeof sendMax === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(sendMax).dropsToNative(),
            };
        }

        return {
            currency: sendMax.currency,
            value: sendMax.value,
            issuer: sendMax.issuer,
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

    get Date(): any {
        return this.Expiration;
    }

    get Expiration(): any {
        const date = get(this, ['object', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get InvoiceID(): string {
        return get(this, ['object', 'InvoiceID'], undefined);
    }

    get isExpired(): boolean {
        const date = get(this, ['Check', 'Expiration'], undefined);
        if (isUndefined(date)) return false;

        const exp = moment.utc(date);
        const now = moment().utc();

        return exp.isBefore(now);
    }
}

/* Export ==================================================================== */
export default Check;
