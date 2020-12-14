import { XRPL_Account } from 'xrpl-accountlib';

import { Card } from 'tangem-sdk-react-native';
import { AccountSchema } from '@store/schemas/latest';

export type ImportSteps =
    | 'AccessLevel'
    | 'SecretType'
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

export interface Props {
    upgrade?: AccountSchema;
    tangemCard?: Card;
}

export interface State {
    currentStep: ImportSteps;
    prevSteps: Array<ImportSteps>;
    account: Partial<AccountSchema>;
    importedAccount: XRPL_Account;
    passphrase?: string;
    upgrade: AccountSchema;
    isLoading: boolean;
}
