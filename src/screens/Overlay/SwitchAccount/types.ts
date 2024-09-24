import { AccountModel } from '@store/models';
import Realm from 'realm';

export interface Props {
    discreetMode: boolean;
    showAddAccountButton: boolean;
    onClose?: () => void;
    onSwitch?: (account: AccountModel) => void;
}

export interface State {
    defaultAccount?: AccountModel;
    accounts?: Realm.Results<AccountModel>;
    signableAccount?: Array<AccountModel>;
    contentHeight: number;
    paddingBottom: number;
}
