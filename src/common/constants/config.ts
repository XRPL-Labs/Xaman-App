/**
 * Global App Config
 */

export default {
    appName: 'Xaman',
    supportEmail: 'support@xaman.app',
    termOfUseURL: 'https://xaman.app/app/webviews/tos-privacy/',
    creditsURL: 'https://xaman.app/app/webviews/credits/',
    changeLogURL: 'https://xaman.app/app/webviews/update/en/?update=',
    explorerProxy: 'https://xaman.app/explorer',
    hooksExplainerURL: 'https://xaman.app/app/webviews/hooks/',

    // persist storage config
    // NOTE: this should never be changed
    storage: {
        keyName: 'xumm-realm-key',
        path: 'xumm.realm',
    },

    // list of static xApp identifiers
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

    // account label limit
    accountLabelLimit: 64,
};
