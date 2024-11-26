import { AccountModel } from '@store/models';

import { CombinedTransactions, FallbackTransaction, Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

import { AccountNameResolveType } from '@services/ResolverService';

export interface Props {
    item: ((Transactions | FallbackTransaction) & MutationsMixinType) | LedgerObjects;
    account: AccountModel;
    participant?: AccountNameResolveType;
    explainer?: ExplainerAbstract<CombinedTransactions | LedgerObjects>;
}
