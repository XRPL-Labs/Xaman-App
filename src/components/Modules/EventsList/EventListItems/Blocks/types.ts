import { AccountModel } from '@store/models';

import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { AccountNameType } from '@common/helpers/resolver';

export interface Props {
    item: (Transactions & MutationsMixinType) | LedgerObjects;
    account: AccountModel;
    participant?: AccountNameType;
    explainer?: ExplainerAbstract<Transactions | PseudoTransactions | LedgerObjects>;
}
