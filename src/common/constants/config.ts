/**
 * Global App Config
 */

export default {
    // App Details
    appName: 'XUMM',
    supportEmail: 'support@xumm.dev',
    termOfUseURL: 'https://xumm.app/app/webviews/tos-privacy/',
    creditsURL: 'https://xumm.app/app/webviews/credits/',
    changeLogURL: 'https://xumm.app/app/webviews/update/en/?update=',

    // Build Configuration - Debug or Release?
    DEV: __DEV__,

    // persist storage config
    storage: {
        keyName: 'xumm-realm-key',
        path: 'xumm.realm',
    },

    // xrpl nodes
    nodes: {
        main: ['wss://xrpl.ws', 'wss://xrpl.link', 'wss://s2.ripple.com'],
        test: ['wss://testnet.xrpl-labs.com', 'wss://s.altnet.rippletest.net:51233'],
    },

    // xrpl explorers
    explorer: [
        {
            value: 'xpring',
            title: 'XRPL.org',
            main: 'https://livenet.xrpl.org/transactions/',
            test: 'https://testnet.xrpl.org/transactions/',
        },
        {
            value: 'bithomp',
            title: 'Bithomp',
            main: 'https://bithomp.com/explorer/',
            test: 'https://test.bithomp.com/explorer/',
        },
        {
            value: 'xrpscan',
            title: 'XRPScan',
            main: 'https://xrpscan.com/tx/',
            test: 'https://test.bithomp.com/explorer/',
        },
        {
            value: 'xrplorer',
            title: 'XRPlorer',
            main: 'https://xrplorer.com/transaction/',
            test: 'https://test.bithomp.com/explorer/',
        },
    ],

    // localization config
    language: {
        default: 'en',
        supported: [
            { value: 'en', title: 'English' },
            { value: 'es', title: 'Spanish' },
            { value: 'ko', title: '韓國語' },
            { value: 'ja', title: '日本語' },
            { value: 'zh', title: '中文' },
        ],
    },

    // app theme config
    theme: {
        light: 'Light',
        dark: 'Dark',
    },
};
