import { get, find } from 'lodash';
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

    // main,test,dev
    const net = connectedChain.replace('net', '').toLowerCase();

    // get explorer object
    const explorer = find(AppConfig.explorer, { value: coreSettings.defaultExplorer });

    return {
        title: get(explorer, 'title', ''),
        tx: get(explorer.tx, net, '#'),
        account: get(explorer.account, net, '#'),
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
