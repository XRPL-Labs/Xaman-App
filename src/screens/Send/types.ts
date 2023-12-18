import { XrplDestination } from 'xumm-string-decode';
import { Payment } from '@common/libs/ledger/transactions';
import { AccountInfoType } from '@common/helpers/resolver';
import { AccountModel, TrustLineModel, CoreModel } from '@store/models';
import { Destination } from '@common/libs/ledger/parser/types';

export enum Steps {
    Details = 'Details',
    Recipient = 'Recipient',
    Summary = 'Summary',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

export interface FeeItem {
    type: string;
    value: string;
}

export interface Props {
    currency?: TrustLineModel;
    scanResult?: XrplDestination;
    amount?: string;
}

export interface State {
    currentStep: Steps;
    accounts: Array<AccountModel>;
    source: AccountModel;
    destination: Destination;
    destinationInfo: AccountInfoType;
    currency: TrustLineModel | string;
    amount: string;
    memo: string;
    selectedFee: FeeItem;
    issuerFee: number;
    payment: Payment;
    scanResult: XrplDestination;
    coreSettings: CoreModel;
    isLoading: boolean;
}

export interface ContextProps extends State {
    setSource: (source: AccountModel) => void;
    setCurrency: (currency: TrustLineModel | string) => void;
    setAmount: (amount: string) => void;
    setDestination: (destination: Destination) => void;
    setDestinationInfo: (info: any) => void;
    setScanResult: (result: XrplDestination) => void;
    setIssuerFee: (issuerFee: number) => void;
    setFee: (fee: FeeItem) => void;
    setMemo: (memo: string) => void;
    getPaymentJsonForFee: () => any;
    goNext: () => void;
    goBack: () => void;
}
