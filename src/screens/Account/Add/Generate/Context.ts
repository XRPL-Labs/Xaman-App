import React from 'react';

import { EncryptionLevels } from '@store/types';

import { GenerateSteps, State } from './types';

interface ContextProps extends State {
    setLabel: (label: string) => void;
    setPassphrase: (passphrase: string) => void;
    setEncryptionLevel: (encryptionLevel: EncryptionLevels) => void;
    goNext: (step?: GenerateSteps) => void;
    goBack: () => void;
}

export const StepsContext = React.createContext<Partial<ContextProps>>({});
