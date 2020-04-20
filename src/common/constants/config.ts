/**
 * Global App Config
 */

export default {
    // App Details
    appName: 'XUMM',
    supportEmail: 'support@xumm.dev',
    termOfUseURL: 'https://xumm.app/app/webviews/tos-privacy/',
    creditsURL: 'https://xumm.app/app/webviews/credits/',

    // Build Configuration - Debug or Release?
    DEV: __DEV__,

    // persist storage config
    storage: {
        keyName: 'xumm-realm-key',
        path: 'xumm.realm',
    },

    // rippled nodes
    nodes: {
        main: ['wss://xrpl.ws', 'wss://s2.ripple.com'],
        test: ['wss://testnet.xrpl-labs.com', 'wss://s.altnet.rippletest.net:51233'],
    },

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
