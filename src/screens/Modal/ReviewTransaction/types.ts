import { AccountSchema, CoreSchema } from '@store/schemas/latest';

import { Payload } from '@common/libs/payload';
import { SubmitResultType } from '@common/libs/ledger/types';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

export enum Steps {
    Review = 'Review',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

export interface Props {
    payload: Payload;
    onResolve?: (transaction: TransactionsType) => void;
    onDecline?: () => void;
    onClose?: () => void;
}

export interface State {
    payload: Payload;
    coreSettings: CoreSchema;
    currentStep: Steps;
    transaction: TransactionsType;
    source: AccountSchema;
    submitResult: SubmitResultType;
    hasError: boolean;
    errorMessage: string;
    isPreparing: boolean;
    isValidating: boolean;
    isValidPayload: boolean;
}

export interface ContextProps extends State {
    setSource: (source: AccountSchema) => void;
    setError: (message: string) => void;
    onClose: () => void;
    onAccept: () => void;
    onFinish: () => void;
    getTransactionLabel: () => string;
}
