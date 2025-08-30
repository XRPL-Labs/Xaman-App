import { XRPL_Account } from 'xrpl-accountlib';

import { AccountModel } from '@store/models';

export type GenerateSteps =
    | 'DegenMode'
    | 'SeedExplanation'
    | 'ViewPublicKey'
    | 'ExplainActivation'
    | 'ViewPrivateKey'
    | 'ConfirmSeed'
    | 'SecurityStep'
    | 'PassphraseStep'
    | 'LabelStep'
    | 'FinishStep';

export interface Props {
    initial?: {
        step?: GenerateSteps;
        secretNumbers?: string[];
    };
}

export interface State {
    currentStep: GenerateSteps;
    prevSteps: Array<GenerateSteps>;
    account: Partial<AccountModel>;
    degenMode: boolean;
    generatedAccount?: XRPL_Account;
    passphrase?: string;
}
