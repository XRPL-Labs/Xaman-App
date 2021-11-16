import { XrplDestination } from 'xumm-string-decode';
import { Payment } from '@common/libs/ledger/transactions';
import { AccountInfoType } from '@common/helpers/resolver';
import { AccountSchema, TrustLineSchema, CoreSchema } from '@store/schemas/latest';
import { Destination } from '@common/libs/ledger/parser/types';

export enum Steps {
    Details = 'Details',
    Recipient = 'Recipient',
    Summary = 'Summary',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

export interface Props {
    currency?: TrustLineSchema;
    scanResult?: XrplDestination;
    amount?: string;
}

export interface State {
    currentStep: Steps;
    accounts: Array<AccountSchema>;
    source: AccountSchema;
    destination: Destination;
    destinationInfo: AccountInfoType;
    currency: TrustLineSchema | string;
    sendingNFT: boolean;
    amount: string;
    fee: string;
    issuerFee: number;
    payment: Payment;
    scanResult: XrplDestination;
    coreSettings: CoreSchema;
    isLoading: boolean;
}

export interface ContextProps extends State {
    setSource: (source: AccountSchema) => void;
    setCurrency: (currency: TrustLineSchema | string) => void;
    setAmount: (amount: string) => void;
    setDestination: (destination: Destination) => void;
    setDestinationInfo: (info: any) => void;
    setScanResult: (result: XrplDestination) => void;
    setIssuerFee: (issuerFee: number) => void;
    setFee: (fee: string) => void;
    goNext: () => void;
    goBack: () => void;
}
