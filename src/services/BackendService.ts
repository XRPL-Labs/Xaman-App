/**
 * Backend service
 * Interact with Xaman backend
 */

import { get, isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { Platform } from 'react-native';
import { OptionsModalPresentationStyle } from 'react-native-navigation';

import { AppScreens } from '@common/constants';
import { Endpoints } from '@common/constants/endpoints';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceUniqueId } from '@common/helpers/device';
import { GetAppReadableVersion } from '@common/helpers/app';

import { NetworkType } from '@store/types';

import CoreRepository from '@store/repositories/core';
import ProfileRepository from '@store/repositories/profile';
import CurrencyRepository from '@store/repositories/currency';

import { Payload, PayloadType } from '@common/libs/payload';
import { InAppPurchaseReceipt } from '@common/libs/iap';

import { LedgerObjectFactory } from '@common/libs/ledger/factory';
import { NFTokenOffer, URIToken } from '@common/libs/ledger/objects';
import { NFTokenOffer as LedgerNFTokenOffer, URIToken as LedgerURIToken } from '@common/libs/ledger/types/ledger';
import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

// services
import PushNotificationsService from '@services/PushNotificationsService';
import ApiService from '@services/ApiService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';
import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

import Localize from '@locale';

import { Props as TermOfUseViewProps } from '@screens/Settings/TermOfUse/types';

/* Types  ==================================================================== */
export interface RatesType {
    rate: number;
    code: string;
    symbol: string;
    lastSync: number;
}

/* Service  ==================================================================== */
/**
 * Service that handles interactions with the backend, including syncing curated IOUs,
 * managing user payloads, and device activation and updates.
 */
class BackendService {
    private rates: Map<string, RatesType>;

    private logger: LoggerInstance;

    constructor() {
        this.logger = LoggerService.createLogger('Backend');
        this.rates = new Map();
    }

    public initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // listen for ledger transaction submit
                LedgerService.on('submitTransaction', this.onLedgerTransactionSubmit);
                NetworkService.on('preSubmitTxEvent', this.addSignedTxBlob);

                // resolve
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
    On Ledger submit transaction
    */
    onLedgerTransactionSubmit = (
        blob: string,
        hash: string,
        network: { id: number; node: string; type: NetworkType; key: string },
    ) => {
        // only if hash is provided
        if (!hash) {
            return;
        }
        this.addTransaction(hash, network).catch((error) => {
            this.logger.error('addTransaction', error);
        });
    };

    syncTokensDetails = async (issuer: string): Promise<void> => {
        try {
            // get all issued currencies from this issuer
            const issuedCurrencies = CurrencyRepository.findBy('issuer', issuer);

            // no currencies ?
            if (issuedCurrencies.isEmpty()) {
                return;
            }

            // get issuer details and token details from backend
            const { details } = await this.getCuratedIOUs({ issuer });

            // try to find issuer details in the response
            const issuerDetails = Object.values(details).find((cp) =>
                Object.values(cp.currencies).some((c) => c.issuer === issuer),
            );

            for (const currency of issuedCurrencies) {
                const currencyDetails = issuerDetails?.currencies[currency.currencyCode];

                const updatedDetails = {
                    name: currencyDetails?.name ?? '',
                    avatarUrl: currencyDetails?.avatar ?? '',
                    issuerAvatarUrl: issuerDetails?.avatar ?? '',
                    issuerName: issuerDetails?.name ?? '',
                    shortlist: currencyDetails?.shortlist === 1,
                    xappIdentifier: currencyDetails?.xapp_identifier ?? '',
                };

                // check if the details has been changed
                const hasChanges = Object.entries(updatedDetails).some(
                    ([key, value]) => (currency as any)[key] !== value,
                );

                // only update if the data has been changed
                if (hasChanges) {
                    await CurrencyRepository.updateCurrencyDetails({
                        id: currency.id,
                        ...updatedDetails,
                        updatedAt: new Date(),
                    });
                } else {
                    // update the time
                    await CurrencyRepository.update({
                        id: currency.id,
                        updatedAt: new Date(),
                    });
                }
            }
        } catch (error) {
            this.logger.error('syncTokensDetails', error);
        }
    };

    /**
     * Gets pending payloads from the backend.
     * @returns {Promise<Payload[]>} A promise that resolves with an array of pending payloads.
     */
    getPendingPayloads = async (): Promise<Payload[]> => {
        return ApiService.fetch(Endpoints.PendingPayloads, 'GET')
            .then((res: { payloads: PayloadType[] }) => {
                const { payloads } = res;

                if (!isEmpty(payloads)) {
                    return Promise.all(payloads.map((payload) => Payload.from(payload)));
                }

                return [];
            })
            .catch((error) => {
                this.logger.error('getPendingPayloads', error);
                return [];
            });
    };

    /**
     * Initiates or adds a user to the Xaman.
     * @returns {Promise<any>} A promise that resolves with the result of initiating or adding a user.
     */
    initUser = async (): Promise<XamanBackend.AddUserResponse> => {
        return new Promise((resolve, reject) => {
            ApiService.fetch(Endpoints.AddUser, 'POST')
                .then((res: XamanBackend.AddUserResponse) => {
                    if (!res) {
                        throw new Error('Cannot add the device to the Xaman');
                    }

                    // set the user id to the network service for socket auth on cluster
                    const { device } = res;
                    NetworkService.setUserId(device.uuid);

                    // resolve
                    return resolve(res);
                })
                .catch((e: any) => {
                    return reject(e);
                });
        });
    };

    /**
     * Activates a device in Xaman.
     * @param {any} user - The user object.
     * @param {any} device - The device object.
     * @returns {Promise<string>} A promise that resolves with an access token.
     */
    activateDevice = async (user: { uuid: string }, device: { uuid: string }): Promise<string> => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            ApiService.fetch(
                Endpoints.ActivateDevice,
                'POST',
                null,
                {
                    uniqueDeviceIdentifier: GetDeviceUniqueId(),
                    devicePlatform: Platform.OS,
                    devicePushToken: await PushNotificationsService.getToken(),
                },
                { Authorization: `${user.uuid}.${device.uuid}` },
            )
                .then((res: XamanBackend.ActivateDeviceResponse) => {
                    const { accessToken } = res;

                    // set the new token to the api service
                    ApiService.setToken(accessToken);

                    resolve(accessToken);
                })
                .catch(() => {
                    reject(new Error('Cannot active the device!'));
                });
        });
    };

    /**
     * Update device information
     *
     * @param {{ devicePushToken: string }} params - An object containing the device push token.
     * @param {string} params.devicePushToken - The push token of the device to be updated.
     * @returns {Promise<string>} The response from the server after updating the device information.
     *
     * @throws Will throw an error if the network request fails.
     */
    updateDevice = async ({ devicePushToken }: { devicePushToken: string }): Promise<string> => {
        return ApiService.fetch(Endpoints.UpdateDevice, 'POST', null, {
            devicePushToken,
        });
    };

    /**
     * Pings the backend and updates the user profile.
     */
    ping = async () => {
        return ApiService.fetch(Endpoints.Ping, 'POST', null, {
            appVersion: GetAppReadableVersion(),
            appLanguage: Localize.getCurrentLocale(),
            appCurrency: CoreRepository.getAppCurrency(),
            devicePushToken: await PushNotificationsService.getToken(),
        })
            .then((res: XamanBackend.PingResponse) => {
                const { auth, badge, env, monetization, tosAndPrivacyPolicyVersion } = res;

                if (auth) {
                    const { user, device } = auth;
                    const { hasPro } = env;
                    const { monetizationType, monetizationStatus, productForPurchase } = monetization;

                    // update the profile
                    ProfileRepository.saveProfile({
                        username: user.name,
                        slug: user.slug,
                        uuid: user.uuidv4,
                        deviceUUID: device.uuidv4,
                        lastSync: new Date(),
                        hasPro,
                        monetization: {
                            monetizationStatus,
                            monetizationType,
                            productForPurchase,
                        },
                    });

                    // check for tos version
                    const profile = ProfileRepository.getProfile();

                    if (profile && profile.signedTOSVersion < Number(tosAndPrivacyPolicyVersion)) {
                        // show the modal to check new policy and confirm new agreement
                        Navigator.showModal<TermOfUseViewProps>(
                            AppScreens.Settings.TermOfUse,
                            { asModal: true },
                            {
                                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                                modal: {
                                    swipeToDismiss: false,
                                },
                            },
                        );
                    }
                }

                if (typeof badge !== 'undefined') {
                    PushNotificationsService.updateBadge(badge);
                }
            })
            .catch((error) => {
                this.logger.error('ping', error);
            });
    };

    getCuratedIOUs = (params: { promoted?: boolean; issuer?: string }): Promise<XamanBackend.CuratedIOUsResponse> => {
        return ApiService.fetch(Endpoints.CuratedIOUs, 'GET', params);
    };

    /**
     * Gets a list of authorized third-party apps.
     * @returns {Promise} A promise that resolves with a list of authorized third-party app.
     */
    getThirdPartyApps = (): Promise<XamanBackend.ThirdPartyPermissionResponse> => {
        return ApiService.fetch(Endpoints.ThirdPartyApps, 'GET');
    };

    /**
     * Revokes a third-party app permission.
     * @param {string} appId - The ID of the third-party app.
     * @returns {Promise} A promise that resolves when the permission is revoked.
     */
    revokeThirdPartyPermission = (appId: string): Promise<XamanBackend.RevokeThirdPartyPermissionResponse> => {
        return ApiService.fetch(Endpoints.ThirdPartyApp, 'DELETE', { appId });
    };

    /**
     * Reports a submitted transaction for security checks.
     * @param {string} hash - The hash of the transaction.
     * @param {object} network - The network information for the transaction.
     * @returns {Promise} A promise that resolves when the transaction is reported.
     */
    addTransaction = (
        hash: string,
        network: {
            node: string;
            type: string;
            key: string;
        },
    ): Promise<XamanBackend.AddTransactionResponse> => {
        return ApiService.fetch(Endpoints.AddTransaction, 'POST', null, {
            hash,
            node: network.node,
            nodeType: network.key,
        });
    };

    /**
     * Reports a signed transaction.
     * @param {string} hash - The hash of the transaction.
     * @param {string} blob - The signed tx blob.
     * @param {string} network - The network key.
     * @returns {Promise} A promise that resolves when the transaction is reported.
     */
    addSignedTxBlob = (
        txhash: string,
        txblob: string,
        feehash: string,
        feeblob: string,
        network: string,
    ): Promise<XamanBackend.AddTransactionResponse> => {
        return ApiService.fetch(Endpoints.AddSignedTxBlob, 'POST', null, {
            txhash,
            txblob,
            feehash,
            feeblob,
            network,
        });
    };

    /**
     * Reports an added account for security checks.
     * @param {string} account - The account to report.
     * @param {string} txblob - The signed transaction blob associated with the account.
     * @param {string} cid - The CID associated with the signed transaction.
     * @returns {Promise} A promise that resolves when the account is reported.
     */
    addAccount = (account: string, txblob: string, cid?: string): Promise<XamanBackend.AddAccountResponse> => {
        return ApiService.fetch(Endpoints.AddAccount, 'POST', null, {
            account,
            txblob,
            cid,
        });
    };

    /**
     * Retrieve/Persist account information
     * @param {string} account - The account to report.
     * @param {string} name - The name of the account as present in Xaman
     * @param {boolean} push - Enable or disable push notifications
     * @returns {Promise} A promise that resolves when the account information persisted.
     */
    privateAccountInfo = (
        account?: string,
        name?: string,
        push?: boolean,
    ): Promise<XamanBackend.PrivateAccountInfoResponse> => {
        return ApiService.fetch(Endpoints.PrivateAccountInfo, 'POST', null, {
            account,
            name,
            push,
        });
    };

    /**
     * Gets details for an account address.
     * @param {string} address - The account address.
     * @returns {Promise} A promise that resolves with account information.
     */
    getAddressInfo = (address: string): Promise<XamanBackend.AccountInfoResponse> => {
        return ApiService.fetch(Endpoints.AddressInfo, 'GET', address);
    };

    /**
     * Looks up usernames and addresses.
     * @param {string} content - The content to look up.
     * @returns {Promise} A promise that resolves with lookup results.
     */
    lookup = (content: string): Promise<XamanBackend.HandleLookupResponse> => {
        return ApiService.fetch(Endpoints.Lookup, 'GET', content);
    };

    /**
     * Gets account risks on account advisory.
     * @param {string} address - The account address.
     * @returns {Promise} A promise that resolves with account advisory information.
     */
    getAccountAdvisory = (address: string): Promise<XamanBackend.AccountAdvisoryResponse> => {
        return ApiService.fetch(Endpoints.AccountAdvisory, 'GET', address);
    };

    /**
     * Gets XApp store listings by category.
     * @param {string} category - The category of XApp listings to retrieve.
     * @returns {Promise} A promise that resolves with the XApp store listings.
     */
    getXAppStoreListings = (category: string): Promise<XamanBackend.XAppStoreListingsResponse> => {
        return ApiService.fetch(Endpoints.XAppsStore, 'GET', { category });
    };

    /**
     * Gets a short list of featured XApps.
     * @returns {Promise} A promise that resolves with the short list of featured XApps.
     */
    getXAppShortList = (): Promise<XamanBackend.XAppShortListResponse> => {
        return ApiService.fetch(Endpoints.XAppsShortList, 'GET', {
            featured: true,
        });
    };

    /**
     * Gets a launch token for an XApp.
     * @param {string} xAppId - The ID of the XApp.
     * @param {any} data - Data associated with the launch request.
     * @returns {Promise} A promise that resolves with the launch token.
     */
    getXAppLaunchToken = (
        xAppId: string,
        data: XamanBackend.XappLunchDataType,
    ): Promise<XamanBackend.XappLunchTokenResponse> => {
        return ApiService.fetch(Endpoints.XAppLaunch, 'POST', { xAppId }, data);
    };

    /**
     * Gets information about an XApp.
     * @param {string} xAppId - The identifier of the XApp.
     * @returns {Promise} A promise that resolves with information about the XApp.
     */
    getXAppInfo = (xAppId: string): Promise<XamanBackend.XappInfoResponse> => {
        return ApiService.fetch(Endpoints.XAppInfo, 'GET', { xAppId });
    };

    /**
     * Gets a list of currencies supported in the app.
     * @returns {Promise} A promise that resolves with the list of currencies.
     */
    getCurrenciesList = (): Promise<XamanBackend.CurrenciesResponse> => {
        return ApiService.fetch(Endpoints.Currencies, 'GET', { locale: Localize.getCurrentLocale() });
    };

    /**
     * Performs an audit trail action for and XRP Ledger account.
     * @param {string} destination - The destination account of the audit trail.
     * @param {{ reason: string }} reason - The reason for the audit trail action.
     * @returns {Promise} A promise that resolves when the audit trail action is completed.
     */
    auditTrail = (destination: string, reason: { reason: string }): Promise<XamanBackend.AuditTrailResponse> => {
        return ApiService.fetch(
            Endpoints.AuditTrail,
            'POST',
            {
                destination,
            },
            reason,
        );
    };

    /**
     * Get service fee
     * NOTE: values are in drops
     */
    getServiceFee = async (
        txJson?: any | undefined,
        payloadUuid?: string,
    ): Promise<{
        availableFees: { type: string; value: string }[];
        feeHooks: number;
        feePercentage: number;
        suggested: string;
    }> => {
        const body = {
            txJson,
            network: NetworkService.network?.key,
            payload: payloadUuid,
        };
        const networkFees = await ApiService.fetch(Endpoints.ServiceFee, 'POST', null, body);
        return networkFees;
    };

    /**
     * Gets translation data based on a UUID.
     * @param {string} uuid - The UUID for translation data.
     * @returns {Promise} A promise that resolves with translation json data.
     */
    getTranslation = (uuid: string): Promise<any> => {
        return ApiService.fetch(Endpoints.Translation, 'GET', { uuid });
    };

    /**
     * Gets details about a list of NFT tokens.
     * @param {string} account - The account associated with the NFT token.
     * @param {string[]} tokens - An array of NFT token IDs.
     * @returns {Promise<XamanBackend.NFTDetailsResponse>} A promise that resolves with details about the NFT tokens.
     */
    getNFTDetails = (account: string, tokens: string[]): Promise<XamanBackend.NFTDetailsResponse> => {
        return ApiService.fetch(Endpoints.NftDetails, 'POST', null, { account, tokens });
    };

    /**
     * Gets a list of XLS20 tokens offered by users.
     * @param {string} account - The account of the user offering XLS20 tokens.
     * @returns {Promise} A promise that resolves with the list of offered XLS20 tokens.
     */
    getNFTOffered = (account: string): Promise<NFTokenOffer[]> | Promise<URIToken[]> => {
        return ApiService.fetch(Endpoints.NftOffered, 'GET', { account })
            .then(async (res: XamanBackend.NFTOfferedResponse) => {
                if (isEmpty(res)) {
                    return [];
                }

                // fetch the offer objects from ledger
                const ledgerOffers = await Promise.all(
                    res
                        .map(({ OfferID, URITokenID, ledger_close_time }) => {
                            return LedgerService.getLedgerEntry<LedgerNFTokenOffer | LedgerURIToken>({
                                index: URITokenID || OfferID,
                            })
                                .then((resp) => {
                                    // something went wrong ?
                                    if ('error' in resp) {
                                        return null;
                                    }

                                    const { node } = resp;
                                    if (node) {
                                        if (
                                            [LedgerEntryTypes.NFTokenOffer, LedgerEntryTypes.URIToken].includes(
                                                node.LedgerEntryType,
                                            ) &&
                                            ledger_close_time
                                        ) {
                                            // combine ledger time with the object so we have some dates to show
                                            return Object.assign(node, {
                                                LedgerCloseTime: ledger_close_time,
                                            });
                                        }
                                    }

                                    return null;
                                })
                                .catch(() => {
                                    return null;
                                });
                        })
                        .filter(Boolean) as unknown as LedgerNFTokenOffer[],
                );

                return ledgerOffers.map(LedgerObjectFactory.fromLedger).filter(Boolean) as NFTokenOffer[];
            })
            .catch((error) => {
                this.logger.error('getNFTOffered', error);
                return [];
            });
    };

    /**
     * Gets network rails data.
     * @returns {Promise} A promise that resolves with network rails data.
     */
    getNetworkRails = (): Promise<XamanBackend.NetworkRailsResponse> => {
        return ApiService.fetch(Endpoints.NetworkRails, 'GET');
    };

    /**
     * Get liquidity boundaries for a specific issuer and currency.
     *
     * @param {string} issuer - The issuer's identifier.
     * @param {string} currency - The currency's identifier.
     * @returns {Promise} - A promise that resolves to an object containing liquidity boundaries.
     */
    getLiquidityBoundaries = (issuer: string, currency: string): Promise<XamanBackend.LiquidityBoundaries> => {
        return ApiService.fetch(Endpoints.LiquidityBoundaries, 'GET', {
            issuer,
            currency,
        });
    };

    /**
     * Gets the exchange rate for a currency.
     * @param {string} currencyCode - The currency code.
     * @returns {Promise} A promise that resolves with the exchange rate data.
     */
    getCurrencyRate = (currencyCode: string): Promise<RatesType> => {
        return new Promise((resolve, reject) => {
            // get current network asset
            const nativeAsset = NetworkService.getNativeAsset();

            // get cache key
            const cacheKey = `${currencyCode}-${nativeAsset}`;

            // check the cached version before requesting from backend
            if (this.rates.has(cacheKey)) {
                // calculate passed seconds from the latest sync
                const passedSeconds = moment().diff(moment.unix(this.rates.get(cacheKey)!.lastSync), 'second');

                // if the latest rate fetch is already less than 60 second return cached value
                if (passedSeconds <= 60) {
                    resolve(this.rates.get(cacheKey)!);
                    return;
                }
            }

            // fetch/update the rate from backend
            ApiService.fetch(Endpoints.Rates, 'GET', {
                currency: currencyCode,
            })
                .then((response: XamanBackend.CurrencyRateResponse) => {
                    const rate = {
                        rate: get(response, NetworkService.getNativeAsset(), 0),
                        code: currencyCode,
                        symbol: get(response, '__meta.currency.symbol'),
                        lastSync: moment().unix(),
                    };
                    this.rates.set(cacheKey, rate);
                    resolve(rate);
                })
                .catch(reject);
        });
    };

    /**
     * Checks whether a specific currency issued by a given issuer is vetted.
     *
     * This function retrieves a list of curated IOUs associated with the issuer
     * and determines if the specified currency is vetted based on the presence of its name
     *
     * @param {string} issuer - The unique identifier of the issuer.
     * @param {string} currency - The currency to check for vetting.
     * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the currency is vetted.
     */
    isVettedCurrency = (issuer: string, currency: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            this.getCuratedIOUs({
                issuer,
            })
                .then(({ details }) => {
                    const vettedCurrency =
                        typeof details === 'object' &&
                        Object.values(details).find((detail) => {
                            return detail?.currencies?.[currency]?.name;
                        });
                    resolve(!!vettedCurrency);
                })
                .catch(reject);
        });
    };

    verifyPurchase = (purchases: InAppPurchaseReceipt) => {
        return ApiService.fetch(Endpoints.VerifyPurchase, 'POST', null, purchases);
    };

    acknowledgePurchase = (purchases: InAppPurchaseReceipt) => {
        return ApiService.fetch(Endpoints.VerifyPurchase, 'PATCH', null, purchases);
    };
}

export default new BackendService();
