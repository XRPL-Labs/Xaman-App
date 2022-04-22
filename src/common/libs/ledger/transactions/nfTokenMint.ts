import BigNumber from 'bignumber.js';
import { get, differenceBy, set, isUndefined } from 'lodash';

import { HexEncoding } from '@common/utils/string';

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

        // if not look at the metadata for token id
        const affectedNodes = get(this.meta, 'AffectedNodes', []);

        affectedNodes.map((node: any) => {
            if (get(node, 'CreatedNode.LedgerEntryType') === 'NFTokenPage') {
                tokenID = get(node, 'CreatedNode.NewFields.NFTokens[0].NFToken.NFTokenID');
            } else if (get(node, 'ModifiedNode.LedgerEntryType') === 'NFTokenPage') {
                const nextTokenPage = get(node, 'ModifiedNode.FinalFields.NFTokens');
                const prevTokenPage = get(node, 'ModifiedNode.PreviousFields.NFTokens');
                tokenID = get(differenceBy(nextTokenPage, prevTokenPage, 'NFToken.NFTokenID'), '[0].NFToken.NFTokenID');
            }
            return true;
        });

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
