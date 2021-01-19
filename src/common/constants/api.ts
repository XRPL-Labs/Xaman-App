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
        ['payload', '/v1/app/payload'],
        ['pendingPayloads', '/v1/app/pending-payloads'],
        ['curatedIOUs', '/v1/app/curated-ious'],
        ['addressInfo', '/v1/app/account-info'],
        ['lookup', '/v1/app/handle-lookup'],
        ['accountAdvisory', '/v1/app/account-advisory'],
        ['liquidityBoundaries', '/v1/app/liquidity-boundaries/{issuer}/{currency}'],
        ['translation', '/v1/app/translation/{uuid}'],
        ['xAppsShortList', '/v1/app/xapp/shortlist/{account}/{version}/{locale}'],
    ]),
};
