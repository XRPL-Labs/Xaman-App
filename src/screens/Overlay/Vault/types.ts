import { Card } from 'tangem-sdk-react-native';

import { AccountSchema, CoreSchema } from '@store/schemas/latest';

import { TransactionsType } from '@common/libs/ledger/transactions/types';
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

export interface Props {
    account: AccountSchema;
    transaction: TransactionsType;
    multiSign?: boolean;
    onDismissed: () => void;
    onSign: (signedObject: SignedObjectType) => void;
}

export interface State {
    signer: AccountSchema;
    alternativeSigner: AccountSchema;
    coreSettings: CoreSchema;
}

export interface ContextProps extends State {
    sign: (method: AuthMethods, options: SignOptions) => void;
    onInvalidAuth: (method: AuthMethods) => void;
    dismiss: () => void;
}
