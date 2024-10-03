import { WebLinks } from '@common/constants/endpoints';

import NetworkService from '@services/NetworkService';

/**
 * Generates a transaction link based on the given transaction ID (ctid).
 *
 * @param {string} ctid - The transaction ID for which the link is generated.
 * @return {string} The formatted transaction link.
 */
const GetTransactionLink = (ctid: string): string => {
    return `${WebLinks.ExplorerProxy}/${NetworkService.getNetworkId()}/${ctid}`;
};

/**
 * Generates a URL link for an account on the blockchain explorer.
 *
 * @param {string} address - The blockchain address for which the link is generated.
 * @returns {string} The URL link to the blockchain explorer for the provided address.
 */
const GetAccountLink = (address: string): string => {
    return `${WebLinks.ExplorerProxy}/${NetworkService.getNetworkId()}/${address}`;
};

/* Export ==================================================================== */
export { GetAccountLink, GetTransactionLink };
