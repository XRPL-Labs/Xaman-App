import { has, get, set, isUndefined, isNumber, toInteger } from 'lodash';
import * as AccountLib from 'xrpl-accountlib';

import NetworkService from '@services/NetworkService';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class CheckCreate extends BaseTransaction {
    public static Type = TransactionTypes.CheckCreate as const;
    public readonly Type = CheckCreate.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = CheckCreate.Type;
        }

        this.fields = this.fields.concat(['Destination', 'SendMax', 'DestinationTag', 'Expiration', 'InvoiceID']);
    }

    get SendMax(): AmountType {
        const sendMax = get(this, ['tx', 'SendMax'], undefined);

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

    set SendMax(input: AmountType | undefined) {
        if (typeof input === 'undefined') {
            set(this, ['tx', 'SendMax'], undefined);
            return;
        }
        // native currency
        if (typeof input === 'string') {
            set(this, ['tx', 'SendMax'], new Amount(input, false).nativeToDrops());
        }

        if (typeof input === 'object') {
            set(this, ['tx', 'SendMax'], {
                currency: input.currency,
                value: input.value,
                issuer: input.issuer,
            });
        }
    }

    get Destination(): Destination {
        const destination = get(this, ['tx', 'Destination'], undefined);
        const destinationTag = get(this, ['tx', 'DestinationTag'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
            tag: destinationTag,
        };
    }

    set Destination(destination: Destination) {
        if (has(destination, 'address')) {
            if (!AccountLib.utils.isValidAddress(destination.address)) {
                throw new Error(`${destination.address} is not a valid Address`);
            }
            set(this, ['tx', 'Destination'], destination.address);
        }

        if (has(destination, 'tag')) {
            if (!isNumber(destination.tag)) {
                // try to convert to number
                set(this, ['tx', 'DestinationTag'], toInteger(destination.tag));
            } else {
                set(this, ['tx', 'DestinationTag'], destination.tag);
            }
        } else {
            set(this, ['tx', 'DestinationTag'], undefined);
        }
    }

    get Expiration(): any {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get InvoiceID(): string {
        return get(this, ['tx', 'InvoiceID'], undefined);
    }
}

/* Export ==================================================================== */
export default CheckCreate;
