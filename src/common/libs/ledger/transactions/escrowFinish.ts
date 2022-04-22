import { get, set, isUndefined, findKey } from 'lodash';

import BaseTransaction from './base';
import Amount from '../parser/common/amount';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';
import { Destination, AmountType } from '../parser/types';

/* Class ==================================================================== */
class EscrowFinish extends BaseTransaction {
    public static Type = TransactionTypes.EscrowFinish as const;
    public readonly Type = EscrowFinish.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = EscrowFinish.Type;
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
            tag: undefined,
        };
    }

    set Owner(owner: string) {
        set(this, ['tx', 'Owner'], owner);
    }

    get Owner(): string {
        return get(this, ['tx', 'Owner']);
    }

    set Fulfillment(fulfillment: string) {
        set(this, ['tx', 'Fulfillment'], fulfillment);
    }

    get Fulfillment(): string {
        return get(this, ['tx', 'Fulfillment']);
    }

    set Condition(condition: string) {
        set(this, ['tx', 'Condition'], condition);
    }

    get Condition(): string {
        return get(this, ['tx', 'Condition']);
    }

    set OfferSequence(sequence: number) {
        set(this, ['tx', 'OfferSequence'], sequence);
    }

    get OfferSequence(): number {
        return get(this, ['tx', 'OfferSequence']);
    }
}

/* Export ==================================================================== */
export default EscrowFinish;
