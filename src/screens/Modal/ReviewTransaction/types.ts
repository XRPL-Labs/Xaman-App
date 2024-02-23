import { AccountModel, CoreModel } from '@store/models';

import { Payload } from '@common/libs/payload';
import { SubmitResultType } from '@common/libs/ledger/types';
import { SignableMutatedTransaction } from '@common/libs/ledger/transactions/types';

export enum Steps {
    Preflight = 'Preflight',
    Review = 'Review',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

export interface Props {
    payload: Payload;
    onResolve?: (transaction: SignableMutatedTransaction, payload: Payload) => void;
    onDecline?: (payload: Payload) => void;
    onClose?: () => void;
}

export interface State {
    payload: Payload;
    coreSettings: CoreModel;
    currentStep: Steps;
    transaction?: SignableMutatedTransaction;
    accounts?: AccountModel[];
    source?: AccountModel;
    submitResult?: SubmitResultType;
    hasError: boolean;
    errorMessage?: string;
    isLoading: boolean;
    isReady: boolean;
    isValidPayload: boolean;
}

export interface ContextProps extends State {
    setTransaction: (tx: SignableMutatedTransaction) => void;
    setAccounts: (accounts: AccountModel[]) => void;
    setSource: (source: AccountModel) => void;
    setLoading: (loading: boolean) => void;
    setReady: (ready: boolean) => void;
    setError: (error: Error) => void;
    onPreflightPass: () => void;
    onClose: () => void;
    onAccept: () => void;
    onFinish: () => void;
    getTransactionLabel: () => string;
}
