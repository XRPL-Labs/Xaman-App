/*  eslint-disable  */
/**
 * Endpoints
 */

export const HOSTNAME = 'xaman.app';
export const ApiUrl = `https://${HOSTNAME}/api`;

export enum Endpoints {
    Ping = '/v1/app/ping',
    AddUser = '/v1/app/add-user',
    ActivateDevice = '/v1/app/activate-device',
    AddDevice = '/v1/app/add-device',
    UpdateDevice = '/v1/app/update-device',
    RefreshToken = '/v1/app/refresh-token',
    Payload = '/v1/app/payload/{uuid}',
    PendingPayloads = '/v1/app/pending-payloads',
    CuratedIOUs = '/v1/app/curated-ious',
    AddressInfo = '/v1/app/account-info',
    Lookup = '/v1/app/handle-lookup',
    AccountAdvisory = '/v1/app/account-advisory',
    LiquidityBoundaries = '/v1/app/liquidity-boundaries/{issuer}/{currency}',
    Translation = '/v1/app/translation/{uuid}',
    XAppsStore = '/v1/app/xapp/store/v1/{category}',
    XAppsShortList = '/v1/app/xapp/shortlist',
    XAppLaunch = '/v1/app/xapp/launch/{xAppId}',
    XAppInfo = '/v1/app/xapp/info/{xAppId}',
    Currencies = '/v1/app/currencies/{locale}',
    Rates = '/v1/app/rates/{currency}',
    AuditTrail = '/v1/app/audit-trail/{destination}',
    AddAccount = '/v1/app/add-account',
    AddTransaction = '/v1/app/add-tx',
    ThirdPartyApps = '/v1/app/third-party-permissions',
    ThirdPartyApp = '/v1/app/third-party-permissions/{appId}',
    NftDetails = '/v1/app/nft-details',
    NftOffered = '/v1/app/nft-offered/{account}',
    NetworkRails = '/v1/app/rails',
    VerifyPurchase = '/v1/app/verify-purchase',
}

export enum WebLinks {
    // Webview
    TermOfUseURL = `https://${HOSTNAME}/app/webviews/tos-privacy`,
    CreditsURL = `https://${HOSTNAME}/app/webviews/credits`,
    ChangeLogURL = `https://${HOSTNAME}/app/webviews/update`,
    HooksExplainerURL = `https://${HOSTNAME}/app/webviews/hooks`,

    // Providers
    ExplorerProxy = `https://${HOSTNAME}/explorer`,
    AvatarURL = `https://${HOSTNAME}/avatar`,

    // Blog and Help center
    FAQSecurityHardwareURL = `https://${HOSTNAME}/redir/faq/security-hardware`,
    FAQAccountSigningPasswordURL = `https://${HOSTNAME}/redir/faq/account-signing-password`,

    // Other
    AppleStoreLink = `https://apps.apple.com/us/app/id1492302343`,
}
