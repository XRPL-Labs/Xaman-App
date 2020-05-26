import { XRPL_Account } from 'xrpl-accountlib';

import { EncryptionLevels } from '@store/types';

export type GenerateSteps =
    | 'ExplainActivation'
    | 'ViewPublicKey'
    | 'SeedExplanation'
    | 'ViewPrivateKey'
    | 'ConfirmSeed'
    | 'SecurityStep'
    | 'PassphraseStep'
    | 'LabelStep'
    | 'FinishStep';

export interface AccountObject {
    generatedAccount?: XRPL_Account;
    passphrase?: string;
    label?: string;
    encryptionLevel?: EncryptionLevels;
}
