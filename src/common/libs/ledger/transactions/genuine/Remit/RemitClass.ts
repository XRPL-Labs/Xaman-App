import { flatMap, get, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import { Amount } from '@common/libs/ledger/parser/common';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, Destination, MintURIToken } from '@common/libs/ledger/parser/types';
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

/* Class ==================================================================== */
class Remit extends BaseTransaction {
    public static Type = TransactionTypes.Remit as const;
    public readonly Type = Remit.Type;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = Remit.Type;
        }

        this.fields = this.fields.concat([
            'Amounts',
            'URITokenIDs',
            'MintURIToken',
            'Destination',
            'InvoiceID',
            'DestinationTag',
            'Blob',
            'Inform',
        ]);
    }

    get Amounts(): Array<AmountType> {
        const amounts = get(this, ['tx', 'Amounts']);

        return flatMap(amounts, ({ AmountEntry }) => {
            if (typeof AmountEntry.Amount === 'string') {
                return {
                    currency: NetworkService.getNativeAsset(),
                    value: new Amount(AmountEntry.Amount).dropsToNative(),
                };
            }

            return {
                currency: AmountEntry.Amount.currency,
                value: AmountEntry.Amount.value,
                issuer: AmountEntry.Amount.issuer,
            };
        });
    }

    get URITokenIDs(): Array<string> {
        return get(this, ['tx', 'URITokenIDs']);
    }

    get MintURIToken(): MintURIToken {
        return get(this, ['tx', 'MintURIToken']);
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

    get InvoiceID(): string {
        return get(this, ['tx', 'InvoiceID'], undefined);
    }

    get Blob(): string {
        return get(this, ['tx', 'Blob'], undefined);
    }

    get Inform(): string {
        return get(this, ['tx', 'Inform'], undefined);
    }
}

/* Export ==================================================================== */
export default Remit;
