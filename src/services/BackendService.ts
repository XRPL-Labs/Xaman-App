/**
 * Backend service
 * Interact with Xaman backend
 */

import { compact, flatMap, get, isEmpty, map, reduce } from 'lodash';
import moment from 'moment-timezone';
import { Platform } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceUniqueId } from '@common/helpers/device';
import { GetAppReadableVersion } from '@common/helpers/app';

import { CurrencyModel } from '@store/models';

import CoreRepository from '@store/repositories/core';
import ProfileRepository from '@store/repositories/profile';
import CounterPartyRepository from '@store/repositories/counterParty';
import CurrencyRepository from '@store/repositories/currency';

import Preferences from '@common/libs/preferences';

import { Payload, PayloadType } from '@common/libs/payload';

import { LedgerObjectFactory } from '@common/libs/ledger/factory';
import { NFTokenOffer } from '@common/libs/ledger/objects';

// services
import PushNotificationsService from '@services/PushNotificationsService';
import ApiService from '@services/ApiService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';
import LedgerService from '@services/LedgerService';

// Locale
import Localize from '@locale';
import NetworkService from '@services/NetworkService';
import { NetworkType } from '@store/types';

/* Types  ==================================================================== */
export interface RatesType {
    rate: number;
    code: string;
    symbol: string;
    lastSync: number;
}

/* Service  ==================================================================== */
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
        this.addTransaction(hash, network).catch((e: any) => {
            this.logger.error('Add transaction error: ', e);
        });
    };

    /**
     * Starts syncing with the backend, including Curated IOUs.
     */
    public sync = () => {
        this.logger.debug('Start Syncing with backend');
        Promise.all([this.ping(), this.syncCuratedIOUs()]);
    };

    /**
     * Updates Curated IOUs list from the backend.
     */
    syncCuratedIOUs = async () => {
        try {
            // in case of not exist, then Number(LOCALE_VERSION) will be 0
            const LOCALE_VERSION = await Preferences.get(Preferences.keys.CURATED_LIST_VERSION);

            const { details, version, changed } = await this.getCuratedIOUs(Number(LOCALE_VERSION));

            // nothing has been changed
            if (!changed) {
                return;
            }

            // update the list
            const updatedParties = await reduce(
                details,
                async (result, value) => {
                    const currenciesList = [] as CurrencyModel[];

                    await Promise.all(
                        map(value.currencies, async (c) => {
                            const currency = await CurrencyRepository.include({
                                id: `${c.issuer}.${c.currency}`,
                                issuer: c.issuer,
                                currency: c.currency,
                                name: c.name,
                                avatar: c.avatar || '',
                                shortlist: c.shortlist === 1,
                                xapp_identifier: c.xapp_identifier || '',
                            });

                            currenciesList.push(currency);
                        }),
                    );

                    await CounterPartyRepository.upsert({
                        id: value.id,
                        name: value.name,
                        domain: value.domain,
                        avatar: value.avatar || '',
                        shortlist: value.shortlist === 1,
                        currencies: currenciesList,
                    });

                    (await result).push(value.id);
                    return result;
                },
                Promise.resolve([]),
            );

            // delete removed parties from data store
            const counterParties = CounterPartyRepository.findAll();
            const removedParties = counterParties.filter((c: any) => {
                return !updatedParties.includes(c.id);
            });

            if (removedParties.length > 0) {
                CounterPartyRepository.delete(removedParties);
            }

            // persist the latest version
            await Preferences.set(Preferences.keys.CURATED_LIST_VERSION, String(version));
        } catch (error: any) {
            this.logger.error('Update Curated IOUs list: ', error);
        }
    };

    /**
     * Gets pending payloads from the backend.
     * @returns {Promise<Payload[]>} A promise that resolves with an array of pending payloads.
     */
    getPendingPayloads = async (): Promise<Payload[]> => {
        return ApiService.pendingPayloads
            .get()
            .then(async (res: { payloads: PayloadType[] }) => {
                const { payloads } = res;

                if (!isEmpty(payloads)) {
                    return Promise.all(flatMap(payloads, Payload.from));
                }

                return [];
            })
            .catch((error: any): any => {
                this.logger.error('Fetch Pending Payloads Error: ', error);
                return [];
            });
    };

    /**
     * Initiates or adds a user to the Xaman.
     * @returns {Promise<any>} A promise that resolves with the result of initiating or adding a user.
     */
    initUser = async (): Promise<XamanBackend.AddUserResponse> => {
        return new Promise((resolve, reject) => {
            ApiService.addUser
                .post()
                .then((res: XamanBackend.AddUserResponse) => {
                    if (!res) {
                        throw new Error('Cannot add the device to the Xaman');
                    }
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
    activateDevice = async (user: any, device: any): Promise<string> => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            ApiService.activateDevice
                .post(
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
     * Pings the backend and updates the user profile.
     */
    ping = async () => {
        return ApiService.ping
            .post(null, {
                appVersion: GetAppReadableVersion(),
                appLanguage: Localize.getCurrentLocale(),
                appCurrency: CoreRepository.getAppCurrency(),
                devicePushToken: await PushNotificationsService.getToken(),
            })
            .then((res: XamanBackend.PingResponse) => {
                const { auth, badge, env, tosAndPrivacyPolicyVersion } = res;

                if (auth) {
                    const { user, device } = auth;
                    const { hasPro } = env;

                    // update the profile
                    ProfileRepository.saveProfile({
                        username: user.name,
                        slug: user.slug,
                        uuid: user.uuidv4,
                        deviceUUID: device.uuidv4,
                        lastSync: new Date(),
                        hasPro,
                    });

                    // check for tos version
                    const profile = ProfileRepository.getProfile();

                    if (profile.signedTOSVersion < Number(tosAndPrivacyPolicyVersion)) {
                        // show the modal to check new policy and confirm new agreement
                        Navigator.showModal(
                            AppScreens.Settings.TermOfUse,
                            { asModal: true },
                            {
                                modalPresentationStyle: 'fullScreen',
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
            .catch((e: any) => {
                this.logger.error('Ping Backend Error: ', e);
            });
    };

    getCuratedIOUs = (version = 0, promoted = false): Promise<XamanBackend.CuratedIOUsResponse> => {
        return ApiService.curatedIOUs.get({ version, promoted });
    };

    /**
     * Gets a list of authorized third-party apps.
     * @returns {Promise} A promise that resolves with a list of authorized third-party app.
     */
    getThirdPartyApps = (): Promise<XamanBackend.ThirdPartyPermissionResponse> => {
        return ApiService.thirdPartyApps.get();
    };

    /**
     * Revokes a third-party app permission.
     * @param {string} appId - The ID of the third-party app.
     * @returns {Promise} A promise that resolves when the permission is revoked.
     */
    revokeThirdPartyPermission = (appId: string): Promise<XamanBackend.RevokeThirdPartyPermissionResponse> => {
        return ApiService.thirdPartyApp.delete({ appId });
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
        return ApiService.addTransaction.post(null, {
            hash,
            node: network.node,
            nodeType: network.key,
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
        return ApiService.addAccount.post(null, {
            account,
            txblob,
            cid,
        });
    };

    /**
     * Gets details for an account address.
     * @param {string} address - The account address.
     * @returns {Promise} A promise that resolves with account information.
     */
    getAddressInfo = (address: string): Promise<XamanBackend.AccountInfoResponse> => {
        return ApiService.addressInfo.get(address);
    };

    /**
     * Looks up usernames and addresses.
     * @param {string} content - The content to look up.
     * @returns {Promise} A promise that resolves with lookup results.
     */
    lookup = (content: string): Promise<XamanBackend.HandleLookupResponse> => {
        return ApiService.lookup.get(content);
    };

    /**
     * Gets account risks on account advisory.
     * @param {string} address - The account address.
     * @returns {Promise} A promise that resolves with account advisory information.
     */
    getAccountAdvisory = (address: string): Promise<XamanBackend.AccountAdvisoryResponse> => {
        return ApiService.accountAdvisory.get(address);
    };

    /**
     * Gets XApp store listings by category.
     * @param {string} category - The category of XApp listings to retrieve.
     * @returns {Promise} A promise that resolves with the XApp store listings.
     */
    getXAppStoreListings = (category: string): Promise<XamanBackend.XAppStoreListingsResponse> => {
        return ApiService.xAppsStore.get({ category });
    };

    /**
     * Gets a short list of featured XApps.
     * @returns {Promise} A promise that resolves with the short list of featured XApps.
     */
    getXAppShortList = (): Promise<XamanBackend.XAppShortListResponse> => {
        return ApiService.xAppsShortList.get({
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
        return ApiService.xAppLaunch.post({ xAppId }, data);
    };

    /**
     * Gets information about an XApp.
     * @param {string} xAppId - The identifier of the XApp.
     * @returns {Promise} A promise that resolves with information about the XApp.
     */
    getXAppInfo = (xAppId: string): Promise<XamanBackend.XappInfoResponse> => {
        return ApiService.xAppInfo.get({ xAppId });
    };

    /**
     * Gets a list of currencies supported in the app.
     * @returns {Promise} A promise that resolves with the list of currencies.
     */
    getCurrenciesList = (): Promise<XamanBackend.CurrenciesResponse> => {
        const locale = Localize.getCurrentLocale();
        return ApiService.currencies.get({ locale });
    };

    /**
     * Performs an audit trail action for and XRP Ledger account.
     * @param {string} destination - The destination account of the audit trail.
     * @param {{ reason: string }} reason - The reason for the audit trail action.
     * @returns {Promise} A promise that resolves when the audit trail action is completed.
     */
    auditTrail = (destination: string, reason: { reason: string }): Promise<XamanBackend.AuditTrailResponse> => {
        return ApiService.auditTrail.post({ destination }, reason);
    };

    /**
     * Gets translation data based on a UUID.
     * @param {string} uuid - The UUID for translation data.
     * @returns {Promise} A promise that resolves with translation json data.
     */
    getTranslation = (uuid: string): Promise<any> => {
        return ApiService.translation.get({ uuid });
    };

    /**
     * Gets details about an XLS20 token.
     * @param {string} account - The account associated with the XLS20 token.
     * @param {string[]} tokens - An array of XLS20 token IDs.
     * @returns {Promise} A promise that resolves with details about the XLS20 tokens.
     */
    getXLS20Details = (account: string, tokens: string[]): Promise<any> => {
        return ApiService.xls20Details.post(null, { account, tokens });
    };

    /**
     * Gets a list of XLS20 tokens offered by users.
     * @param {string} account - The account of the user offering XLS20 tokens.
     * @returns {Promise} A promise that resolves with the list of offered XLS20 tokens.
     */
    getXLS20Offered = (account: string): Array<NFTokenOffer> => {
        return ApiService.xls20Offered
            .get({ account })
            .then(async (res: Array<any>) => {
                if (isEmpty(res)) {
                    return [];
                }
                // fetch the offer objects from ledger
                const ledgerOffers = await Promise.all(
                    flatMap(res, async (offer) => {
                        const { OfferID } = offer;
                        return LedgerService.getLedgerEntry({ index: OfferID })
                            .then((resp) => {
                                const { node } = resp;
                                if (node?.LedgerEntryType === 'NFTokenOffer') {
                                    // combine ledger time with the object
                                    return Object.assign(resp.node, {
                                        LedgerTime: get(offer, 'ledger_close_time'),
                                    });
                                }
                                return null;
                            })
                            .catch(() => {
                                return null;
                            });
                    }),
                );

                return compact(flatMap(ledgerOffers, LedgerObjectFactory.fromLedger));
            })
            .catch((error: string): any => {
                this.logger.error('Fetch XLS20 offered Error: ', error);
                return [];
            });
    };

    /**
     * Gets network rails data.
     * @returns {Promise} A promise that resolves with network rails data.
     */
    getNetworkRails = (): Promise<XamanBackend.NetworkRailsResponse> => {
        return ApiService.networkRails.get();
    };

    /**
     * Get liquidity boundaries for a specific issuer and currency.
     *
     * @param {string} issuer - The issuer's identifier.
     * @param {string} currency - The currency's identifier.
     * @returns {Promise} - A promise that resolves to an object containing liquidity boundaries.
     */
    getLiquidityBoundaries = (issuer: string, currency: string): Promise<XamanBackend.LiquidityBoundaries> => {
        return ApiService.liquidityBoundaries.get({
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
                const passedSeconds = moment().diff(moment.unix(this.rates.get(cacheKey).lastSync), 'second');

                // if the latest rate fetch is already less than 60 second return cached value
                if (passedSeconds <= 60) {
                    resolve(this.rates.get(cacheKey));
                    return;
                }
            }

            // fetch/update the rate from backend
            ApiService.rates
                .get({ currency: currencyCode })
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
}

export default new BackendService();
