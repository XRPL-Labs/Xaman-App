import { find, get, set, isUndefined } from 'lodash';

import NetworkService from '@services/NetworkService';

import Amount from '@common/libs/ledger/parser/common/amount';

import BaseTransaction from '@common/libs/ledger/transactions/genuine/BaseTransaction';

/* Types ==================================================================== */
import { AmountType, Destination } from '@common/libs/ledger/parser/types';
import { TransactionJSONType, TransactionTypes } from '@common/libs/ledger/types';

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

        const node = find(affectedNodes, (o) => o?.DeletedNode?.LedgerEntryType === 'Escrow');
        const object = get(node, 'DeletedNode.FinalFields');

        if (isUndefined(object)) return undefined;

        if (typeof object.Amount === 'string') {
            return {
                currency: NetworkService.getNativeAsset(),
                value: new Amount(object.Amount).dropsToNative(),
            };
        }

        return {
            currency: object.Amount.currency,
            value: object.Amount.value,
            issuer: object.Amount.issuer,
        };
    }

    get Destination(): Destination {
        const affectedNodes = get(this, ['meta', 'AffectedNodes'], []);

        const node = find(affectedNodes, (o) => o?.DeletedNode?.LedgerEntryType === 'Escrow');
        const object = get(node, 'DeletedNode.FinalFields');

        if (!isUndefined(object)) {
            return {
                address: object.Destination,
                tag: object.DestinationTag,
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
