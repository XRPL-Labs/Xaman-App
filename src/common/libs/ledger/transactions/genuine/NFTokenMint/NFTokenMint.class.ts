import { EncodeNFTokenID } from '@common/utils/codec';

import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob, UInt32, UInt16, Amount } from '@common/libs/ledger/parser/fields';
import { RippleTime, TransferFee } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenMint extends BaseGenuineTransaction {
    public static Type = TransactionTypes.NFTokenMint as const;
    public readonly Type = NFTokenMint.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        NFTokenTaxon: { required: true, type: UInt32 },
        Issuer: { type: AccountID },
        TransferFee: { type: UInt16, codec: TransferFee },
        URI: { type: Blob },
        Amount: { type: Amount },
        Destination: { type: AccountID },
        Expiration: { type: UInt32, codec: RippleTime },
    };

    declare NFTokenTaxon: FieldReturnType<typeof UInt32>;
    declare Issuer: FieldReturnType<typeof AccountID>;
    declare TransferFee: FieldReturnType<typeof UInt16, typeof TransferFee>;
    declare URI: FieldReturnType<typeof Blob>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenMint.Type;
    }

    set NFTokenID(id: string) {
        this._meta.nftoken_id = id;
    }

    get NFTokenID(): string {
        if (!this._meta?.AffectedNodes) {
            throw new Error('Determining the minted NFTokenID necessitates the metadata!');
        }

        // fixNFTokenRemint will include the minted nfTokenId in the metaData
        let nfTokenID = this._meta?.nftoken_id;

        // if we already set the token id return
        if (nfTokenID) {
            return nfTokenID;
        }

        // which account issued this token
        const issuer = this.Issuer || this.Account;

        // Fetch minted token sequence
        let tokenSequence = 0;
        let nextTokenSequence = 0;
        let firstNFTokenSequence = 0;

        this._meta?.AffectedNodes?.forEach((node: any) => {
            if (node.ModifiedNode && node.ModifiedNode.LedgerEntryType === 'AccountRoot') {
                const { PreviousFields, FinalFields } = node.ModifiedNode;
                if (PreviousFields && FinalFields && FinalFields.Account === issuer) {
                    tokenSequence = PreviousFields.MintedNFTokens;
                    nextTokenSequence = FinalFields.MintedNFTokens;
                    firstNFTokenSequence = PreviousFields?.FirstNFTokenSequence || FinalFields?.FirstNFTokenSequence;
                }
            }
        });

        // First minted token, set token sequence to zero
        if (typeof tokenSequence === 'undefined' && nextTokenSequence === 1) {
            tokenSequence = 0;
        }

        // Include first NFToken Sequence
        tokenSequence += firstNFTokenSequence;

        const intFlags = this._tx.Flags ?? 0;
        const rawTransferFee = this._tx.TransferFee as number;
        const taxon = this._tx.NFTokenTaxon as number;

        nfTokenID = EncodeNFTokenID(issuer, tokenSequence, intFlags!, rawTransferFee, taxon);

        // store the token id
        this.NFTokenID = nfTokenID;

        return nfTokenID;
    }
}

/* Export ==================================================================== */
export default NFTokenMint;
