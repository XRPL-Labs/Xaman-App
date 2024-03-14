/**
 * AccountSet transaction
 */

import { isUndefined } from 'lodash';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob, Hash128, Hash256, UInt32 } from '@common/libs/ledger/parser/fields';
import { FlagIndices, Hex, TransferRate } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AccountSet extends BaseGenuineTransaction {
    public static Type = TransactionTypes.AccountSet as const;
    public readonly Type = AccountSet.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        SetFlag: { type: UInt32, codec: FlagIndices },
        ClearFlag: { type: UInt32, codec: FlagIndices },
        Domain: { type: Blob, codec: Hex },
        EmailHash: { type: Hash128 },
        MessageKey: { type: Blob },
        TransferRate: { type: UInt32, codec: TransferRate },
        TickSize: { type: UInt32 },
        NFTokenMinter: { type: Blob },
        WalletLocator: { type: Hash256 },
        WalletSize: { type: UInt32 },
    };

    declare SetFlag: FieldReturnType<typeof UInt32, typeof FlagIndices>;
    declare ClearFlag: FieldReturnType<typeof UInt32, typeof FlagIndices>;
    declare Domain: FieldReturnType<typeof Blob, typeof Hex>;
    declare EmailHash: FieldReturnType<typeof Hash128>;
    declare MessageKey: FieldReturnType<typeof Blob>;
    declare TransferRate: FieldReturnType<typeof UInt32, typeof TransferRate>;
    declare TickSize: FieldReturnType<typeof UInt32>;
    declare NFTokenMinter: FieldReturnType<typeof AccountID>;
    declare WalletLocator: FieldReturnType<typeof Hash256>;
    declare WalletSize: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AccountSet.Type;
    }

    public isNoOperation(): boolean {
        return (
            isUndefined(this.SetFlag) &&
            isUndefined(this.ClearFlag) &&
            isUndefined(this.Domain) &&
            isUndefined(this.EmailHash) &&
            isUndefined(this.MessageKey) &&
            isUndefined(this.TransferRate) &&
            isUndefined(this.TickSize) &&
            isUndefined(this.NFTokenMinter) &&
            isUndefined(this.WalletLocator) &&
            isUndefined(this.WalletSize)
        );
    }

    public isCancelTicket(): boolean {
        return (
            !isUndefined(this.TicketSequence) &&
            this.TicketSequence > 0 &&
            !isUndefined(this.Sequence) &&
            this.Sequence === 0
        );
    }
}

/* Export ==================================================================== */
export default AccountSet;
