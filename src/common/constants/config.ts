/**
 * Global App Config
 */

export default {
    // App Details and URL's
    appName: 'Xaman',
    supportEmail: 'support@xumm.dev',
    termOfUseURL: 'https://xumm.app/app/webviews/tos-privacy/',
    creditsURL: 'https://xumm.app/app/webviews/credits/',
    changeLogURL: 'https://xumm.app/app/webviews/update/en/?update=',
    explorerProxy: 'https://xumm.app/explorer',

    // persist storage config
    storage: {
        keyName: 'xumm-realm-key',
        path: 'xumm.realm',
    },

    // list of static xapp identifiers
    xappIdentifiers: {
        support: 'xumm.support',
        nftInfo: 'xumm.nft-info',
        activateAccount: 'xumm.activateacc',
        xappDonation: 'xumm.xapp-donation',
    },

    // localization config
    defaultLanguage: 'en',

    // default Currency
    defaultCurrency: 'USD',

    // app theme config
    defaultTheme: 'light',
};
