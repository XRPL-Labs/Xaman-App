/**
 * Global App Config
 */

export default {
    appName: 'Xaman',
    supportEmail: 'support@xaman.app',

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
        swap: 'xaman.swap',
    },

    // localization config
    defaultLanguage: 'en',

    // default Currency
    defaultCurrency: 'USD',

    // app theme config
    defaultTheme: 'light',

    // account label limit
    accountLabelLimit: 64,

    // TX filtering in EventsView
    belowDropsTxIsSpam: 10000, // 10k drops, 0.01 of asset

    // Account to send fees to
    feeAccount: 'ryouhapPYV5KNHmFUKrjNqsjxhnxvQiVt',
};
