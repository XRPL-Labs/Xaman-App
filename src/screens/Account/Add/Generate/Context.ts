import React from 'react';

import { EncryptionLevels } from '@store/types';

import { GenerateSteps, State } from './types';

interface ContextProps extends State {
    setLabel: (label: string, callback?: any) => void;
    setPassphrase: (passphrase: string, callback?: any) => void;
    setEncryptionLevel: (encryptionLevel: EncryptionLevels, callback?: any) => void;
    goNext: (step?: GenerateSteps, callback?: any) => void;
    goBack: () => void;
}

export const StepsContext = React.createContext<ContextProps>({} as any as ContextProps);
