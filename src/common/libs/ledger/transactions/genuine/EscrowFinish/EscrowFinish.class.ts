import { EscrowCreate } from '@common/libs/ledger/transactions/genuine/EscrowCreate';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, UInt32, Blob, Hash256, STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class EscrowFinish extends BaseGenuineTransaction {
    public static Type = TransactionTypes.EscrowFinish as const;
    public readonly Type = EscrowFinish.Type;

    private _escrowObject?: EscrowCreate;

    public static Fields: { [key: string]: FieldConfig } = {
        Owner: { type: AccountID },
        OfferSequence: { type: UInt32 },
        Condition: { type: Blob },
        Fulfillment: { type: Blob },
        EscrowID: { type: Hash256 },
        CredentialIDs: { type: STArray },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare OfferSequence: FieldReturnType<typeof UInt32>;
    declare Condition: FieldReturnType<typeof Blob>;
    declare Fulfillment: FieldReturnType<typeof Blob>;
    declare EscrowID: FieldReturnType<typeof Hash256>;
    declare CredentialIDs: FieldReturnType<typeof STArray, string[]>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = EscrowFinish.Type;
    }

    get Escrow(): EscrowCreate {
        if (this._escrowObject) {
            return this._escrowObject;
        }

        const affectedNodes = this._meta?.AffectedNodes ?? [];

        const deletedEscrowNode = affectedNodes.find(
            (node) => 'DeletedNode' in node && node?.DeletedNode?.LedgerEntryType === 'Escrow',
        )?.DeletedNode;

        this._escrowObject = new EscrowCreate(deletedEscrowNode?.FinalFields as any);

        return this._escrowObject!;
    }
}

/* Export ==================================================================== */
export default EscrowFinish;
