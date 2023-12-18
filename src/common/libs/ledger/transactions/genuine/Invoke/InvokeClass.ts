import { get, isUndefined } from 'lodash';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { Destination } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

/* Class ==================================================================== */
class Invoke extends BaseTransaction {
    public static Type = TransactionTypes.Invoke as const;
    public readonly Type = Invoke.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = Invoke.Type;
        }

        this.fields = this.fields.concat(['Blob', 'Destination', 'InvoiceID', 'DestinationTag']);
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

    get Blob(): string {
        return get(this, ['tx', 'Blob']);
    }

    get InvoiceID(): string {
        return get(this, ['tx', 'InvoiceID']);
    }
}

/* Export ==================================================================== */
export default Invoke;
