import { get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class URITokenMint extends BaseTransaction {
    public static Type = TransactionTypes.URITokenMint as const;
    public readonly Type = URITokenMint.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = URITokenMint.Type;
        }

        this.fields = this.fields.concat(['URI', 'Digest', 'Amount', 'Destination']);
    }

    get URI(): string {
        return get(this, ['tx', 'URI']);
    }

    get Digest(): string {
        return get(this, ['tx', 'Digest']);
    }

    get Amount(): AmountType {
        const amount = get(this, ['tx', 'Amount']);

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
            tag: undefined,
        };
    }
}

/* Export ==================================================================== */
export default URITokenMint;
