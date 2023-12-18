import { XRPL_Account } from 'xrpl-accountlib';

import { AccountModel } from '@store/models';

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
    account: Partial<AccountModel>;
    generatedAccount: XRPL_Account;
    passphrase?: string;
}
