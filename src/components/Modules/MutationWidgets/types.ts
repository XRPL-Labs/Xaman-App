import { AccountModel } from '@store/models';

import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { ComponentTypes } from '@services/NavigationService';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

export interface Props {
    item: (Transactions | LedgerObjects) & MutationsMixinType;
    account: AccountModel;
    advisory?: string;
    explainer?: ExplainerAbstract<Transactions | PseudoTransactions | LedgerObjects>;
    componentType: ComponentTypes;
}
