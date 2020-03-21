import { get, isUndefined, findKey } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';
import { Destination, AmountType } from '../parser/types';

/* Class ==================================================================== */
class EscrowFinish extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'EscrowFinish';
        }

        this.fields = this.fields.concat(['Owner', 'OfferSequence', 'Condition', 'Fulfillment']);
    }

    get Amount(): AmountType {
        const affectedNodes = get(this, ['meta', 'AffectedNodes'], []);

        const finalFields = get(
            affectedNodes,
            `${findKey(affectedNodes, 'DeletedNode')}.DeletedNode.FinalFields`,
            undefined,
        );

        if (isUndefined(finalFields)) return undefined;

        return {
            currency: 'XRP',
            value: new Amount(finalFields.Amount).dropsToXrp(),
        };
    }

    get Destination(): Destination {
        const affectedNodes = get(this, ['meta', 'AffectedNodes'], []);

        const finalFields = get(
            affectedNodes,
            `${findKey(affectedNodes, 'DeletedNode')}.DeletedNode.FinalFields`,
            undefined,
        );

        if (!isUndefined(finalFields)) {
            return {
                address: finalFields.Destination,
                tag: finalFields.DestinationTag,
            };
        }

        return {
            address: '',
        };
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner']);
    }

    get Fulfillment(): number {
        return get(this, ['tx', 'Fulfillment']);
    }

    get Condition(): string {
        return get(this, ['tx', 'Condition']);
    }

    get OfferSequence(): string {
        return get(this, ['tx', 'OfferSequence']);
    }
}

/* Export ==================================================================== */
export default EscrowFinish;
