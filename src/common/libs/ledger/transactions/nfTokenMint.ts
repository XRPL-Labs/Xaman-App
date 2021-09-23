import BigNumber from 'bignumber.js';
import { get, last, set, isUndefined } from 'lodash';

import { HexEncoding } from '@common/utils/string';

import BaseTransaction from './base';

/* Types ==================================================================== */
import { LedgerTransactionType } from '../types';

/* Class ==================================================================== */
class NFTokenMint extends BaseTransaction {
    [key: string]: any;

    constructor(tx?: LedgerTransactionType) {
        super(tx);
        // set transaction type if not set
        if (isUndefined(this.Type)) {
            this.Type = 'NFTokenMint';
        }

        this.fields = this.fields.concat(['Issuer', 'URI', 'TokenTaxon', 'TransferFee']);
    }

    get Issuer(): string {
        return get(this, ['tx', 'Issuer']);
    }

    get URI(): string {
        const uri = get(this, ['tx', 'URI'], undefined);

        if (isUndefined(uri)) return undefined;

        return HexEncoding.toString(uri);
    }

    get TokenTaxon(): number {
        return get(this, ['tx', 'TokenTaxon']);
    }

    set TokenID(id: string) {
        set(this, 'tokenID', id);
    }

    get TokenID(): string {
        let tokenID = get(this, 'tokenID', undefined);

        // if we already set the token id return
        if (tokenID) {
            return tokenID;
        }

        // if not look at the meta data for token id
        const affectedNodes = get(this.meta, 'AffectedNodes', []);
        affectedNodes.map((node: any) => {
            if (get(node, 'CreatedNode.LedgerEntryType') === 'NFTokenPage') {
                tokenID = get(node, 'CreatedNode.NewFields.NonFungibleTokens[0].NonFungibleToken.TokenID');
            } else if (get(node, 'ModifiedNode.LedgerEntryType') === 'NFTokenPage') {
                const tokenPage = get(node, 'ModifiedNode.FinalFields.NonFungibleTokens');
                tokenID = get(last(tokenPage), 'NonFungibleToken.TokenID');
            }

            this.TokenID = tokenID;
            return true;
        });

        return tokenID;
    }

    get TransferFee(): number {
        const transferFee = get(this, ['tx', 'TransferFee'], undefined);

        if (isUndefined(transferFee)) return undefined;

        return new BigNumber(transferFee).dividedBy(10000000).minus(100).toNumber();
    }
}

/* Export ==================================================================== */
export default NFTokenMint;
