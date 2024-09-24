import { CoreModel } from '@store/models';

export interface Props {
    onUnlock?: () => void;
}

export interface State {
    coreSettings: CoreModel;
    isBiometricAvailable: boolean;
    error?: string;
}
