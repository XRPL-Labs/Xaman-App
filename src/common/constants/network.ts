import { NetworkType } from '@store/types';

// Supported networks
// NOTE: any changes here should be applied in patches/react-native+VERSION.patch as well

export default {
    baseReserve: 10, // default network base reserve in native currency
    ownerReserve: 2, // default network owner reserve in native currency
    netFee: 12, // default network net fee in drops

    networks: [
        {
            name: 'XRP Ledger',
            key: 'MAINNET',
            networkId: 0,
            nativeAsset: 'XRP',
            color: '#3C06F3',
            type: NetworkType.Main,
            nodes: ['wss://xrplcluster.com', 'wss://xrpl.link', 'wss://s2.ripple.com'],
        },
        {
            name: 'Xahau',
            key: 'XAHAU',
            networkId: 21337,
            nativeAsset: 'XRP',
            color: '#F27920',
            type: NetworkType.Main,
            nodes: ['wss://xahau.network'],
        },
        {
            name: 'XAHAU Testnet',
            key: 'XAHAUTESTNET',
            networkId: 31338,
            nativeAsset: 'XRP',
            color: '#DC143C',
            type: NetworkType.Test,
            nodes: ['wss://dev.xahau.network'],
        },
        {
            name: 'XRPL Testnet',
            key: 'TESTNET',
            networkId: 1,
            nativeAsset: 'XRP',
            color: '#56CA24',
            type: NetworkType.Test,
            nodes: ['wss://testnet.xrpl-labs.com', 'wss://s.altnet.rippletest.net:51233'],
        },
        {
            name: 'XRPL Devnet',
            key: 'DEVNET',
            networkId: 2,
            nativeAsset: 'XRP',
            color: '#E12BD3',
            type: NetworkType.Dev,
            nodes: ['wss://s.devnet.rippletest.net:51233'],
        },
    ],

    // custom node url endpoint
    customNodeProxy: 'wss://custom-node.xrpl-labs.com',

    // cluster endpoints
    clusterEndpoints: ['wss://xrplcluster.com', 'wss://xahau.network'],

    // legacy config
    legacy: {
        defaultExplorer: 'xpring',
        defaultNode: 'wss://xrplcluster.com',
    },
};
