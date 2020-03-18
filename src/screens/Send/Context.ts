import React from 'react';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';
import { Destination } from '@common/libs/ledger/parser/types';

import { State } from './SendView';

interface ContextProps extends State {
    setSource: (source: AccountSchema) => void;
    setCurrency: (currency: TrustLineSchema | string) => void;
    setAmount: (amount: string) => void;
    setDestination: (destination: Destination) => void;
    setDestinationInfo: (info: any) => void;
    goNext: () => void;
    goBack: () => void;
}

export const StepsContext = React.createContext<Partial<ContextProps>>({});
