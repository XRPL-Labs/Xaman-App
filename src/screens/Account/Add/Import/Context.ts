import React from 'react';

import { XRPL_Account } from 'xrpl-accountlib';

import { EncryptionLevels, AccessLevels, AccountTypes } from '@store/types';

import { ImportSteps, SecretTypes, State } from './types';

interface ContextProps extends State {
    setImportedAccount: (importedAccount: XRPL_Account, callback?: any) => void;
    setLabel: (label: string, callback?: any) => void;
    setPassphrase: (passphrase: string, callback?: any) => void;
    setEncryptionLevel: (encryptionLevel: EncryptionLevels, callback?: any) => void;
    setAccessLevel: (accessLevels: AccessLevels, callback?: any) => void;
    setAccountType: (type: AccountTypes, callback?: any) => void;
    setAdditionalInfo: (info: Object, callback?: any) => void;
    setTangemSignature: (signature: string, callback?: any) => void;
    setSecretType: (type: SecretTypes, callback?: any) => void;
    goNext: (step?: ImportSteps) => void;
    goBack: () => void;
}

export const StepsContext = React.createContext<Partial<ContextProps>>({});
