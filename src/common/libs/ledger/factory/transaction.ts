import { get } from 'lodash';

import * as TransactionClasses from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactionClasses from '@common/libs/ledger/transactions/pseudo';

// mixins
import { MixingTypes, SignMixinType, MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { MutationsMixin, SignMixin } from '@common/libs/ledger/mixin';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';

import { PseudoTransactionTypes } from '@common/libs/ledger/types/enums';
import { AccountTxTransaction } from '@common/libs/ledger/types/methods';

/* Module ==================================================================== */
const TransactionFactory = {
    applyMixins: <T>(
        base: any,
        mixin: MixingTypes[],
    ): (T & SignMixinType) | (T & MutationsMixinType) | (T & SignMixinType & MutationsMixinType) => {
        return mixin.reduce((previousValue: any, currentValue: MixingTypes) => {
            switch (currentValue) {
                case MixingTypes.Mutation:
                    return MutationsMixin(previousValue);
                case MixingTypes.Sign:
                    return SignMixin(previousValue);
                default:
                    return base;
            }
        }, base);
    },

    /**
     * Returns a pseudo transaction based on the given type.
     *
     * @function
     * @param {TransactionJson} json - The JSON representation of the transaction.
     * @param {PseudoTransactionTypes} type - The type of pseudo transaction to generate.
     * @param mixins
     * @throws {Error} Throws an error if the pseudo transaction type is unsupported.
     */
    getPseudoTransaction: (json: TransactionJson, type: PseudoTransactionTypes, mixins?: MixingTypes[]) => {
        // get the Pseudo transaction class
        const PseudoTransaction = PseudoTransactionClasses[type];

        if (typeof PseudoTransaction === 'undefined') {
            throw new Error(`Unsupported Pseudo transaction type ${type}`);
        }

        const Mixed = TransactionFactory.applyMixins<typeof PseudoTransaction>(PseudoTransaction, mixins ?? []);

        return new Mixed(json);
    },

    /**
     * Returns a transaction based on the given transaction JSON.
     *
     * @function
     * @param {TransactionJson} transaction - The JSON representation of the transaction.
     * @param {TransactionMetadata} [meta] - Optional metadata associated with the transaction.
     * @param mixin - Optional mixin for transaction.
     * @throws {Error} Throws an error if the transaction type is unsupported.
     */
    getTransaction: (transaction: TransactionJson, meta?: TransactionMetadata, mixin?: MixingTypes[]) => {
        // get the transaction type
        const type = transaction?.TransactionType;

        if (typeof type === 'undefined') {
            throw new Error('getTransaction required TransactionType to be set in txJson!');
        }

        // get transaction class
        const Transaction = get(TransactionClasses, type, undefined);

        if (typeof Transaction === 'undefined') {
            throw new Error(`Unsupported transaction type ${type}`);
        }

        // apply mixins
        const Mixed = TransactionFactory.applyMixins<typeof Transaction>(Transaction, mixin ?? []);

        // return the transaction object
        return new Mixed(transaction, meta);
    },

    /**
     * Parses a LEDGER transaction and returns a Transaction instance.
     *
     * @function
     * @param {TransactionJson} item - The ledger transaction to parse.
     * @param mixin - List Mixing to apply to the transaction instance
     * @throws {Error} Throws an error if the provided item is not a valid Ledger transaction type.
     */
    fromLedger: (item: AccountTxTransaction, mixin?: MixingTypes[]) => {
        if (typeof item?.tx !== 'object' || typeof item?.meta !== 'object') {
            throw new Error('Provided item is not a valid Ledger transaction type!');
        }

        if (mixin && MixingTypes.Sign in mixin) {
            throw new Error('Applying Sign mixing is not allowed for already validated transactions');
        }

        const transaction = get(item, 'tx');
        const meta = get(item, 'meta');
        return TransactionFactory.getTransaction(transaction, meta, mixin);
    },

    /**
     * Parses a JSON transaction and returns a Transaction instance.
     *
     * @function
     * @param {TransactionJson} item - The JSON representation of the transaction to parse.
     * @param mixin - List Mixing to apply to the transaction instance
     */
    fromJson: (item: TransactionJson, mixin?: MixingTypes[]) => {
        return TransactionFactory.getTransaction(item, undefined, mixin);
    },
};

/* Export ==================================================================== */
export default TransactionFactory;
