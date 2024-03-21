import { StringType } from 'xumm-string-decode';
import { CoreModel } from '@store/models';

export interface Props {
    onRead?: (decoded: any) => void;
    onClose?: () => void;
    blackList?: StringType[];
    type?: StringType;
    fallback?: boolean;
}

export interface State {
    isLoading: boolean;
    coreSettings: CoreModel;
}
