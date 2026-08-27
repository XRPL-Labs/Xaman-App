import React from 'react';
import { TextStyle, ViewStyle } from 'react-native';

import { AccountModel } from '@store/models';

import { Transactions, FallbackTransaction } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';

import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

import { ComponentTypes } from '@services/NavigationService';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

import { type cachedTokenDetailsState } from '@components/Modules/EventsList/EventListItems/Transaction';

// Props for the Transaction component used by BatchTransactions
export interface TransactionComponentProps {
    item: Transactions & MutationsMixinType;
    account: AccountModel;
    timestamp?: number;
    onPress?: () => void;
    showDespiteThirdParty?: boolean;
    notFound?: boolean;
    isReplayed?: boolean;
}

export interface Props {
    item: ((FallbackTransaction | Transactions) & MutationsMixinType) | LedgerObjects;
    account: AccountModel;
    isPaymentScreen?: boolean;
    noIssuanceId?: boolean;
    labelStyle?: ViewStyle | ViewStyle[] | TextStyle | TextStyle[];
    contentStyle?: ViewStyle | ViewStyle[] | TextStyle | TextStyle[];
    advisory?: string;
    explainer?: ExplainerAbstract<FallbackTransaction | Transactions | LedgerObjects>;
    componentType: ComponentTypes;
    cachedTokenDetails?: cachedTokenDetailsState;
    // Optional Transaction component for BatchTransactions widget
    TransactionComponent?: React.ComponentType<TransactionComponentProps>;
}
