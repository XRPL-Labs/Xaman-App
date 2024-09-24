import CoreModel from '@store/models/objects/core';

export interface Props {
    version: string;
}

export interface State {
    coreSettings: CoreModel;
}
