import NetworkService from '@services/NetworkService';
import { AppConfig } from '@common/constants';

const GetTransactionLink = (ctid: string): string => {
    return `${AppConfig.explorerProxy}/${NetworkService.getNetworkId()}/${ctid}`;
};

const GetAccountLink = (address: string): string => {
    return `${AppConfig.explorerProxy}/${NetworkService.getNetworkId()}/${address}`;
};

/* Export ==================================================================== */
export { GetAccountLink, GetTransactionLink };
