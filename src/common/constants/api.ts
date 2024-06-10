/*  eslint-disable  */
/**
 * API Config
 */

export default {
    // The API URL we're connecting to
    apiUrl: 'https://xumm.app/api',

    // Map short names to the actual endpoints, so that we can
    // use them like so: AppAPI.ENDPOINT_NAME.METHOD()
    // NOTE: They should start with a /

    endpoints: new Map([
        ['ping', '/v1/app/ping'],
        ['addUser', '/v1/app/add-user'],
        ['activateDevice', '/v1/app/activate-device'],
        ['addDevice', '/v1/app/add-device'],
        ['updateDevice', '/v1/app/update-device'],
        ['refreshToken', '/v1/app/refresh-token'],
        ['payload', '/v1/app/payload/{uuid}'],
        ['pendingPayloads', '/v1/app/pending-payloads'],
        ['curatedIOUs', '/v1/app/curated-ious'],
        ['addressInfo', '/v1/app/account-info'],
        ['lookup', '/v1/app/handle-lookup'],
        ['accountAdvisory', '/v1/app/account-advisory'],
        ['liquidityBoundaries', '/v1/app/liquidity-boundaries/{issuer}/{currency}'],
        ['translation', '/v1/app/translation/{uuid}'],
        ['xAppsStore', '/v1/app/xapp/store/v1/{category}'],
        ['xAppsShortList', '/v1/app/xapp/shortlist'],
        ['xAppLaunch', '/v1/app/xapp/launch/{xAppId}'],
        ['xAppInfo', '/v1/app/xapp/info/{xAppId}'],
        ['currencies', '/v1/app/currencies/{locale}'],
        ['rates', '/v1/app/rates/{currency}'],
        ['auditTrail', '/v1/app/audit-trail/{destination}'],
        ['addAccount', '/v1/app/add-account'],
        ['addTransaction', '/v1/app/add-tx'],
        ['thirdPartyApps', '/v1/app/third-party-permissions'],
        ['thirdPartyApp', '/v1/app/third-party-permissions/{appId}'],
        ['nftDetails', '/v1/app/nft-details'],
        ['nftOffered', '/v1/app/nft-offered/{account}'],
        ['networkRails', '/v1/app/rails'],
        ['verifyPurchase', '/v1/app/verify-purchase'],
    ]),
};
