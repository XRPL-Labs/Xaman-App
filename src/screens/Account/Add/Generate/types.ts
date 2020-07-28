import { XRPL_Account } from 'xrpl-accountlib';

import { AccountSchema } from '@store/schemas/latest';

export type GenerateSteps =
    | 'SeedExplanation'
    | 'ViewPublicKey'
    | 'ExplainActivation'
    | 'ViewPrivateKey'
    | 'ConfirmSeed'
    | 'SecurityStep'
    | 'PassphraseStep'
    | 'LabelStep'
    | 'FinishStep';

export interface Props {}

export interface State {
    currentStep: GenerateSteps;
    prevSteps: Array<GenerateSteps>;
    account: Partial<AccountSchema>;
    generatedAccount: XRPL_Account;
    passphrase?: string;
}
