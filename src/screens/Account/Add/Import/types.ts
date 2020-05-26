import { XRPL_Account } from 'xrpl-accountlib';

import { AccessLevels, EncryptionLevels } from '@store/types';

export type ImportSteps =
    | 'AccessLevel'
    | 'AccountType'
    | 'EnterAddress'
    | 'EnterSecretNumbers'
    | 'EnterSeed'
    | 'MnemonicAlert'
    | 'EnterMnemonic'
    | 'ConfirmPublicKey'
    | 'ExplainActivation'
    | 'SecurityStep'
    | 'PassphraseStep'
    | 'LabelStep'
    | 'FinishStep';

export interface AccountObject {
    importedAccount?: XRPL_Account;
    passphrase?: string;
    accessLevel?: AccessLevels;
    encryptionLevel?: EncryptionLevels;
    accountType?: string;
    label?: string;
}
