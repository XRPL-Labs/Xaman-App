import { XRPL_Account } from 'xrpl-accountlib';

import { Card } from 'tangem-sdk-react-native';
import { AccountModel } from '@store/models';

export enum SecretTypes {
    SecretNumbers = 'secretNumbers',
    FamilySeed = 'familySeed',
    Mnemonic = 'mnemonic',
}

type XrplAltFamilySeedAlphabet = {
    name: string;
    alphabet: string | boolean;
    params?: Record<string, unknown>;
    xapp?: string;
};

export type ImportSteps =
    | 'AccessLevel'
    | 'SecretType'
    | 'EnterAddress'
    | 'EnterSecretNumbers'
    | 'EnterSeed'
    | 'MnemonicAlert'
    | 'EnterMnemonic'
    | 'VerifySignature'
    | 'ConfirmPublicKey'
    | 'ExplainActivation'
    | 'SecurityStep'
    | 'PassphraseStep'
    | 'LabelStep'
    | 'FinishStep';

export interface Props {
    upgradeAccount?: AccountModel;
    tangemCard?: Card;
    alternativeSeedAlphabet?: XrplAltFamilySeedAlphabet;
    importOfflineSecretNumber?: boolean;
}

export interface State {
    currentStep: ImportSteps;
    prevSteps: Array<ImportSteps>;
    account: Partial<AccountModel>;
    importedAccount?: XRPL_Account;
    passphrase?: string;
    tangemSignature?: string;
    secretType: SecretTypes;
    upgradeAccount?: AccountModel;
    alternativeSeedAlphabet?: XrplAltFamilySeedAlphabet;
    importOfflineSecretNumber?: boolean;
    isLoading: boolean;
}
