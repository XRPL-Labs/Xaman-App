import React from 'react';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { AccountModel } from '@store/models';

import * as MutationWidgets from '@components/Modules/MutationWidgets';
import { Props as MutationWidgetProps } from '@components/Modules/MutationWidgets/types';

export interface Props {
    item: (Transactions | LedgerObjects) & MutationsMixinType;
    account: AccountModel;
}

export interface State {
    advisory?: string;
    explainer?: ExplainerAbstract<Transactions | PseudoTransactions | LedgerObjects>;
}

export type WidgetKey = keyof typeof MutationWidgets;
export type WidgetComponents = {
    [key in WidgetKey]: React.ComponentClass<MutationWidgetProps>;
};
