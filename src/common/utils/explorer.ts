import NetworkService from '@services/NetworkService';
import { AppConfig } from '@common/constants';

const GetTransactionLink = (ctid: string): string => {
    return `${AppConfig.explorerProxy}${ctid}`;
};

const GetAccountLink = (address: string): string => {
    return `${AppConfig.explorerProxy}${address}/?networkId=${NetworkService.getNetworkId()}`;
};

/* Export ==================================================================== */
export { GetAccountLink, GetTransactionLink };
