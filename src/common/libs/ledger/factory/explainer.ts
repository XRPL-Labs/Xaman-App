import { get } from 'lodash';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';
import * as LedgerObjects from '@common/libs/ledger/objects';

import { FallbackTransactionInfo } from '@common/libs/ledger/transactions/fallback';

import { AccountModel } from '@store/models/objects';

/* Types ==================================================================== */
import {
    FallbackTypes,
    InstanceTypes,
    LedgerEntryTypes,
    PseudoTransactionTypes,
    TransactionTypes,
} from '@common/libs/ledger/types/enums';
import { CombinedTransactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects as LedgerObjectsType } from '@common/libs/ledger/objects/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

/* Module ==================================================================== */
const ExplainerFactory = {
    fromLedgerObject: (
        item: LedgerObjectsType,
        account: AccountModel,
    ): ExplainerAbstract<LedgerObjectsType, any> | undefined => {
        let Explainer: any;
        if (item.Type in LedgerEntryTypes) {
            Explainer = get(LedgerObjects, `${item.Type}Info`, undefined);
        }

        if (typeof Explainer === 'undefined') {
            console.warn(`Explainer "${item.Type}Info" not found, no fallback available!`);
            return undefined;
        }

        return new Explainer(item, account);
    },

    fromTransaction: (
        item: CombinedTransactions & MutationsMixinType,
        account: AccountModel,
    ): ExplainerAbstract<CombinedTransactions, MutationsMixinType> => {
        let Explainer;

        const ExplainerKeyName = `${item.Type}Info`;

        if (
            item.InstanceType === InstanceTypes.FallbackTransaction &&
            item.Type === FallbackTypes.FallbackTransaction
        ) {
            return new FallbackTransactionInfo(item, account);
        }

        if (item.Type in TransactionTypes && Object.keys(Transactions).includes(ExplainerKeyName)) {
            Explainer = (Transactions as any)[ExplainerKeyName];
        }

        if (item.Type in PseudoTransactionTypes && Object.keys(PseudoTransactions).includes(ExplainerKeyName)) {
            Explainer = (PseudoTransactions as any)[ExplainerKeyName];
        }

        if (typeof Explainer === 'undefined') {
            throw new Error(`Explainer "${item.Type}Info" not found, forgot to include it?`);
        }

        return new Explainer(item, account);
    },

    fromInstance: (
        item: (CombinedTransactions & MutationsMixinType) | LedgerObjectsType,
        account: AccountModel,
    ): ExplainerAbstract<CombinedTransactions | LedgerObjectsType, MutationsMixinType> | undefined => {
        switch (item.InstanceType) {
            case InstanceTypes.GenuineTransaction:
            case InstanceTypes.PseudoTransaction:
            case InstanceTypes.FallbackTransaction:
                return ExplainerFactory.fromTransaction(item, account);
            case InstanceTypes.LedgerObject:
                return ExplainerFactory.fromLedgerObject(item, account);
            default:
                return undefined;
        }
    },
};

/* Export ==================================================================== */
export default ExplainerFactory;
