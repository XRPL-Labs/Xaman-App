import { CoreModel } from '@store/models';

export interface Props {
    version: string;
}

export interface State {
    coreSettings: CoreModel;
}
