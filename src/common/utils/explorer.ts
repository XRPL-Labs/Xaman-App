import find from 'lodash/find';
import { AppConfig } from '@common/constants';

import { CoreRepository, CustomNodeRepository } from '@store/repositories';

import SocketService from '@services/SocketService';

import { NodeChain } from '@store/types';

export type ExplorerDetails = {
    title: string;
    tx: string;
    account: string;
};

const GetExplorer = (): ExplorerDetails => {
    const connectedChain = SocketService.chain;
    const connectedNode = SocketService.node;

    // if connected to custom node
    if (connectedChain === NodeChain.Custom) {
        return CustomNodeRepository.getNodeExplorer(connectedNode);
    }

    const coreSettings = CoreRepository.getSettings();

    const net = connectedChain === NodeChain.Main ? 'main' : 'test';
    const explorer = find(AppConfig.explorer, { value: coreSettings.defaultExplorer });

    return {
        title: explorer.title,
        tx: explorer.tx[net],
        account: explorer.account[net],
    };
};

const GetTransactionLink = (hash: string, explorer?: ExplorerDetails) => {
    if (!explorer) {
        explorer = GetExplorer();
    }
    const { tx } = explorer;
    return `${tx || '#'}${hash}`;
};

const GetAccountLink = (address: string, explorer?: ExplorerDetails) => {
    if (!explorer) {
        explorer = GetExplorer();
    }
    const { account } = explorer;
    return `${account || '#'}${address}`;
};

/* Export ==================================================================== */
export { GetExplorer, GetAccountLink, GetTransactionLink };
