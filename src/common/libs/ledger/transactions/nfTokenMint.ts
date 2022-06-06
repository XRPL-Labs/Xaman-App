import BigNumber from 'bignumber.js';
import { get, set, isUndefined } from 'lodash';

import { HexEncoding } from '@common/utils/string';
import { EncodeNFTokenID } from '@common/utils/codec';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { TransactionJSONType, TransactionTypes } from '../types';

/* Class ==================================================================== */
class NFTokenMint extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenMint as const;
    public readonly Type = NFTokenMint.Type;

    constructor(tx?: TransactionJSONType, meta?: any) {
        super(tx, meta);

        // set transaction type if not set
        if (isUndefined(this.TransactionType)) {
            this.TransactionType = NFTokenMint.Type;
        }

        this.fields = this.fields.concat(['Issuer', 'URI', 'NFTokenTaxon', 'TransferFee']);
    }

    get Issuer(): string {
        return get(this, ['tx', 'Issuer']);
    }

    get URI(): string {
        const uri = get(this, ['tx', 'URI'], undefined);

        if (isUndefined(uri)) return undefined;

        return HexEncoding.toString(uri);
    }

    get NFTokenTaxon(): number {
        return get(this, ['tx', 'NFTokenTaxon']);
    }

    set NFTokenID(id: string) {
        set(this, 'nfTokenID', id);
    }

    get NFTokenID(): string {
        let tokenID = get(this, 'nfTokenID', undefined);

        // if we already set the token id return
        if (tokenID) {
            return tokenID;
        }

        // Fetch minted token sequence
        let tokenSequence;
        let nextTokenSequence;

        this.meta.AffectedNodes.forEach((node: any) => {
            if (node.ModifiedNode && node.ModifiedNode.LedgerEntryType === 'AccountRoot') {
                const { PreviousFields, FinalFields } = node.ModifiedNode;
                if (PreviousFields && FinalFields && FinalFields.Account === this.Account.address) {
                    tokenSequence = PreviousFields.MintedNFTokens;
                    nextTokenSequence = FinalFields.MintedNFTokens;
                }
            }
        });

        // First minted token, set token sequence to zero
        if (typeof tokenSequence === 'undefined' && nextTokenSequence === 1) {
            tokenSequence = 0;
        }

        // Unable to find TokenSequence
        if (typeof tokenSequence === 'undefined') {
            return '';
        }

        const intFlags = get(this, ['tx', 'Flags'], undefined);
        tokenID = EncodeNFTokenID(this.Account.address, tokenSequence, intFlags, this.TransferFee, this.NFTokenTaxon);

        // store the token id
        this.NFTokenID = tokenID;

        return tokenID;
    }

    get TransferFee(): number {
        const transferFee = get(this, ['tx', 'TransferFee'], undefined);

        if (isUndefined(transferFee)) return undefined;

        return new BigNumber(transferFee).dividedBy(1000).toNumber();
    }
}

/* Export ==================================================================== */
export default NFTokenMint;
