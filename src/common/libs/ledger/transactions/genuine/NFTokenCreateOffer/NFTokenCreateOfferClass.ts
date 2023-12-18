import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';
import LedgerDate from '@common/libs/ledger/parser/common/date';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { Destination, AmountType } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class NFTokenCreateOffer extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenCreateOffer as const;
    public readonly Type = NFTokenCreateOffer.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = NFTokenCreateOffer.Type;
        }

        this.fields = this.fields.concat(['Amount', 'Destination', 'Expiration', 'Owner', 'NFTokenID']);
    }

    // @ts-ignore
    get Amount(): AmountType {
        let amount = undefined as AmountType;

        amount = get(this, ['tx', 'Amount']);

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
        const destination = get(this, ['tx', 'Destination'], undefined);

        if (isUndefined(destination)) return undefined;

        return {
            address: destination,
        };
    }

    get Expiration(): string {
        const date = get(this, ['tx', 'Expiration'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner']);
    }

    get NFTokenID(): string {
        return get(this, ['tx', 'NFTokenID']);
    }
}

/* Export ==================================================================== */
export default NFTokenCreateOffer;
