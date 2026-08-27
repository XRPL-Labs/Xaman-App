import BaseLedgerObject from '@common/libs/ledger/objects/base';

import { AccountID, Hash256, Hash192, UInt8, UInt32, UInt64, Issue, Blob } from '@common/libs/ledger/parser/fields';

import AmountParser from '@common/libs/ledger/parser/common/amount';
import { AmountType } from '@common/libs/ledger/parser/types';

/* Types ==================================================================== */
import { Vault as VaultEntry } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Vault extends BaseLedgerObject<VaultEntry> {
    public static Type = LedgerEntryTypes.Vault as const;
    public readonly Type = Vault.Type;

    // Note: AssetsTotal, AssetsAvailable, LossUnrealized, AssetsMaximum are NOT in Fields
    // because we handle them with custom getters that properly convert based on Asset type
    public static Fields = {
        Owner: { type: AccountID },
        Account: { type: AccountID },
        Asset: { type: Issue },
        ShareMPTID: { type: Hash192 },
        Scale: { type: UInt8 },
        DomainID: { type: Hash256 },
        Data: { type: Blob },
        WithdrawalPolicy: { type: UInt8 },
        Sequence: { type: UInt32 },
        Flags: { type: UInt32 },
        PreviousTxnID: { type: Hash256 },
        PreviousTxnLgrSeq: { type: UInt32 },
        OwnerNode: { type: UInt64 },
    };

    declare Owner: FieldReturnType<typeof AccountID>;
    declare Account: FieldReturnType<typeof AccountID>;
    declare Asset: FieldReturnType<typeof Issue>;
    declare ShareMPTID: FieldReturnType<typeof Hash192>;
    declare Scale: FieldReturnType<typeof UInt8>;
    declare DomainID: FieldReturnType<typeof Hash256>;
    declare Data: FieldReturnType<typeof Blob>;
    declare WithdrawalPolicy: FieldReturnType<typeof UInt8>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare PreviousTxnID: FieldReturnType<typeof Hash256>;
    declare PreviousTxnLgrSeq: FieldReturnType<typeof UInt32>;
    declare OwnerNode: FieldReturnType<typeof UInt64>;

    constructor(object: VaultEntry) {
        super(object);

        this.LedgerEntryType = LedgerEntryTypes.Vault;
    }

    /**
     * Convert vault amount based on Asset type
     * - For XRP vaults: value is in drops, convert to XRP
     * - For IOU/MPT vaults: value is in token units, use as-is
     */
    private formatVaultAmount(rawValue: string | number | undefined): AmountType | undefined {
        if (rawValue === undefined || rawValue === null) {
            return undefined;
        }

        // Convert to string if it's a number
        const valueStr = String(rawValue);

        // XRP vaults have no issuer in the Asset field
        const isXrpVault = !this.Asset?.issuer;

        if (isXrpVault) {
            // XRP vault: value is in drops, convert to XRP
            return {
                currency: 'XRP',
                value: new AmountParser(valueStr).dropsToNative().toString(),
            };
        }

        // IOU/MPT vault: value is already in token units
        return {
            currency: this.Asset?.currency || '',
            value: valueStr,
            issuer: this.Asset?.issuer,
        };
    }

    get AssetsTotal(): AmountType | undefined {
        return this.formatVaultAmount(this._object.AssetsTotal);
    }

    get AssetsAvailable(): AmountType | undefined {
        return this.formatVaultAmount(this._object.AssetsAvailable);
    }

    get LossUnrealized(): AmountType | undefined {
        return this.formatVaultAmount(this._object.LossUnrealized);
    }

    get AssetsMaximum(): AmountType | undefined {
        return this.formatVaultAmount(this._object.AssetsMaximum);
    }

    get isPrivate(): boolean {
        return !!(this.Flags && (typeof this.Flags === 'number' ? this.Flags & 0x00010000 : false));
    }
}

/* Export ==================================================================== */
export default Vault;
