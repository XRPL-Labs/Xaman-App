// import { CoreModel } from '@store/models';

export interface Props {
    asModal: boolean;
}

export interface State {
    TOSVersion: number;
    isTOSLoaded: boolean;
    shouldShowAgreement: boolean;
    // coreSettings: CoreModel;
}
