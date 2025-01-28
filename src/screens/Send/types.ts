import { XrplDestination } from 'xumm-string-decode';

import { Payment } from '@common/libs/ledger/transactions';

import { AccountAdvisoryResolveType } from '@services/ResolverService';

import { Destination } from '@common/libs/ledger/parser/types';

import { SignMixinType } from '@common/libs/ledger/mixin/types';

import { AccountModel, TrustLineModel, CoreModel } from '@store/models';

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
    token?: TrustLineModel;
    scanResult?: XrplDestination;
    amount?: string;
}

export interface State {
    currentStep: Steps;
    accounts: Array<AccountModel>;
    source?: AccountModel;
    destination?: Destination;
    destinationInfo?: AccountAdvisoryResolveType;
    token: TrustLineModel | string;
    amount: string;
    memo?: string;
    selectedFee?: FeeItem;
    issuerFee?: number;
    serviceFeeAmount?: FeeItem;
    payment: Payment & SignMixinType;
    scanResult?: XrplDestination;
    coreSettings: CoreModel;
    isLoading: boolean;
}

export interface ContextProps extends State {
    setSource: (source: AccountModel) => void;
    setToken: (token: TrustLineModel | string) => void;
    setAmount: (amount: string) => void;
    setDestination: (destination: Destination | undefined) => void;
    setDestinationInfo: (info: any) => void;
    setScanResult: (result: XrplDestination) => void;
    setIssuerFee: (issuerFee: number) => void;
    setServiceFeeAmount: (amount: FeeItem) => void;
    setFee: (txFee: FeeItem, serviceFee: FeeItem) => void;
    setMemo: (memo: string) => void;
    getPaymentJsonForFee: () => any;
    goNext: () => void;
    goBack: () => void;
}
