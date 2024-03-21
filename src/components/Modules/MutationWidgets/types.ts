import { AccountModel } from '@store/models';

import { Transactions, FallbackTransaction } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { ComponentTypes } from '@services/NavigationService';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

export interface Props {
    item: ((FallbackTransaction | Transactions) & MutationsMixinType) | LedgerObjects;
    account: AccountModel;
    advisory?: string;
    explainer?: ExplainerAbstract<FallbackTransaction | Transactions | LedgerObjects>;
    componentType: ComponentTypes;
}
