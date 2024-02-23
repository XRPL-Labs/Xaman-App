import { Card } from 'tangem-sdk-react-native';

import { AccountModel, CoreModel } from '@store/models';

import { SignMixinType } from '@common/libs/ledger/mixin/types';

import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import { SignedObjectType } from '@common/libs/ledger/types';

export enum AuthMethods {
    PIN = 'PIN',
    BIOMETRIC = 'BIOMETRIC',
    PASSPHRASE = 'PASSPHRASE',
    TANGEM = 'TANGEM',
    OTHER = 'OTHER',
}

export interface SignOptions {
    encryptionKey?: string;
    tangemCard?: Card;
}

export enum Steps {
    SelectSigner = 'SelectSigner',
    Authentication = 'Authentication',
}

export interface Props {
    account: AccountModel;
    transaction: (Transactions | PseudoTransactions) & SignMixinType;
    multiSign?: boolean;
    onDismissed: () => void;
    onSign: (signedObject: SignedObjectType) => void;
}

export interface State {
    step?: Steps;
    signers?: AccountModel[];
    preferredSigner?: AccountModel;
    coreSettings: CoreModel;
    isSigning: boolean;
}

export interface ContextProps extends State {
    sign: (method: AuthMethods, options: SignOptions) => void;
    onPreferredSignerSelect: (signer: AccountModel) => void;
    onInvalidAuth: (method: AuthMethods) => void;
    dismiss: () => void;
}
