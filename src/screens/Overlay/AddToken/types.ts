import { AccountModel } from '@store/models';

export interface Props {
    account: AccountModel;
}

export interface State {
    dataSource?: XamanBackend.CuratedIOUsDetails;
    selectedPartyId?: number;
    selectedCurrencyId?: number;
    isLoading: boolean;
    isLoadingTokenInfo: boolean;
    error: boolean;
}
