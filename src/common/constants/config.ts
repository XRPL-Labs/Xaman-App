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
            tx: {
                main: 'https://livenet.xrpl.org/transactions/',
                test: 'https://testnet.xrpl.org/transactions/',
            },
            account: {
                main: 'https://livenet.xrpl.org/accounts/',
                test: 'https://testnet.xrpl.org/accounts/',
            },
        },
        {
            value: 'bithomp',
            title: 'Bithomp',
            tx: {
                main: 'https://bithomp.com/explorer/',
                test: 'https://test.bithomp.com/explorer/',
            },
            account: {
                main: 'https://bithomp.com/explorer/',
                test: 'https://test.bithomp.com/explorer/',
            },
        },
        {
            value: 'xrpscan',
            title: 'XRPScan',
            tx: {
                main: 'https://xrpscan.com/tx/',
                test: 'https://test.bithomp.com/explorer/',
            },
            account: {
                main: 'https://xrpscan.com/account/',
                test: 'https://test.bithomp.com/explorer/',
            },
        },
        {
            value: 'xrplorer',
            title: 'XRPlorer',
            tx: {
                main: 'https://xrplorer.com/transaction/',
                test: 'https://test.bithomp.com/explorer/',
            },
            account: {
                main: 'https://xrplorer.com/account/',
                test: 'https://test.bithomp.com/explorer/',
            },
        },
    ],

    thirdParty: {
        XRPToolkit: 'https://www.xrptoolkit.com/',
    },

    // localization config
    defaultLanguage: 'en',

    // default Currency
    defaultCurrency: 'USD',

    // app theme config
    theme: {
        light: 'Light',
        dark: 'Dark',
    },
};
