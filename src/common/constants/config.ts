/**
 * Global App Config
 */
import { NetworkType } from '@store/types';
import { ColorsGeneral } from '@theme/colors';

export default {
    // App Details
    appName: 'XUMM',
    supportEmail: 'support@xumm.dev',
    termOfUseURL: 'https://xumm.app/app/webviews/tos-privacy/',
    creditsURL: 'https://xumm.app/app/webviews/credits/',
    changeLogURL: 'https://xumm.app/app/webviews/update/en/?update=',

    // persist storage config
    storage: {
        keyName: 'xumm-realm-key',
        path: 'xumm.realm',
    },

    // supported networks
    // NOTE: any changes here should be applied in patches/react-native+VERSION.patch as well
    networks: [
        {
            name: 'XRPL',
            networkId: 0,
            color: ColorsGeneral.blue,
            type: NetworkType.Main,
            nodes: ['wss://xrplcluster.com', 'wss://xrpl.link', 'wss://s2.ripple.com'],
        },
        {
            name: 'XRPL Testnet',
            networkId: 1,
            color: ColorsGeneral.green,
            type: NetworkType.Test,
            nodes: ['wss://testnet.xrpl-labs.com', 'wss://s.altnet.rippletest.net:51233'],
        },
        {
            name: 'XRPL Devnet',
            networkId: 2,
            color: ColorsGeneral.purple,
            type: NetworkType.Dev,
            nodes: ['wss://s.devnet.rippletest.net:51233'],
        },
        {
            name: 'XAHAU',
            networkId: 21337,
            color: ColorsGeneral.orange,
            type: NetworkType.Main,
            nodes: ['wss://xahau.network'],
        },
        {
            name: 'XAHAU Testnet',
            networkId: 21338,
            color: ColorsGeneral.red,
            type: NetworkType.Test,
            nodes: ['wss://dev.xahau.network'],
        },
    ],

    // custom node url endpoint
    customNodeProxy: 'wss://custom-node.xrpl-labs.com',

    // cluster endpoints
    clusterEndpoints: ['wss://xrplcluster.com', 'wss://xahau.network'],

    // default network base and owner reserve
    network: {
        baseReserve: 10, // in XRP
        ownerReserve: 2, // in XRP
        netFee: 12, // in drops
    },

    // localization config
    defaultLanguage: 'en',

    // default Currency
    defaultCurrency: 'USD',

    // app theme config
    defaultTheme: 'light',

    // legacy config
    legacy: {
        defaultExplorer: 'xpring',
        defaultNode: 'wss://xrplcluster.com',
    },
};
