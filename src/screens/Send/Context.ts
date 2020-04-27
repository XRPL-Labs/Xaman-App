import React from 'react';

import { Payment } from '@common/libs/ledger/transactions';
import { AccountInfoType } from '@common/helpers/resolver';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';
import { Destination } from '@common/libs/ledger/parser/types';

enum Steps {
    Details = 'Details',
    Recipient = 'Recipient',
    Summary = 'Summary',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

interface State {
    currentStep: Steps;
    accounts: Array<AccountSchema>;
    source: AccountSchema;
    destination: Destination;
    destinationInfo: AccountInfoType;
    currency: TrustLineSchema | string;
    amount: string;
    payment: Payment;
    scanResult: Destination;
}

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
