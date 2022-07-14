/**
 * Backend service
 * Interact with XUMM backend
 */

import { map, isEmpty, flatMap, get, reduce } from 'lodash';
import moment from 'moment-timezone';

import { Platform } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceUniqueId } from '@common/helpers/device';
import { GetAppReadableVersion } from '@common/helpers/app';

import { CurrencySchema } from '@store/schemas/latest';

import CoreRepository from '@store/repositories/core';
import ProfileRepository from '@store/repositories/profile';
import CounterPartyRepository from '@store/repositories/counterParty';
import CurrencyRepository from '@store/repositories/currency';

import { Payload, PayloadType } from '@common/libs/payload';

// services
import PushNotificationsService from '@services/PushNotificationsService';
import NavigationService, { RootType } from '@services/NavigationService';
import ApiService from '@services/ApiService';
import SocketService from '@services/SocketService';
import LoggerService from '@services/LoggerService';

// Locale
import Localize from '@locale';

/* Service  ==================================================================== */
class BackendService {
    private logger: any;
    private latestCurrencyRate: any;

    constructor() {
        this.logger = LoggerService.createLogger('Backend');

        this.latestCurrencyRate = undefined;
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // sync the details after moving to default stack
                NavigationService.on('setRoot', this.onRootChange);

                // resolve
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /*
    On navigation root changed
     */
    onRootChange = (root: RootType) => {
        if (root === RootType.DefaultRoot) {
            this.sync();
        }
    };

    /*
    Start syncing with backend
    NOTE: This includes Curated IOUs
    */
    sync = () => {
        this.logger.debug('Start Syncing with backend');
        this.syncCuratedIOUs();
    };

    /*
    Update IOUs from backend
    */
    syncCuratedIOUs = () => {
        ApiService.curatedIOUs
            .get()
            .then(async (res: any) => {
                const { details } = res;

                const updatedParties = await reduce(
                    details,
                    async (result, value) => {
                        const currenciesList = [] as CurrencySchema[];

                        await Promise.all(
                            map(value.currencies, async (c) => {
                                const currency = await CurrencyRepository.include({
                                    id: `${c.issuer}.${c.currency}`,
                                    issuer: c.issuer,
                                    currency: c.currency,
                                    name: c.name,
                                    avatar: c.avatar || '',
                                    shortlist: c.shortlist === 1,
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
            })
            .catch((error: string) => {
                this.logger.error('Update Curated IOUs Error: ', error);
            });
    };

    /*
    get Pending Payloads
    */
    getPendingPayloads = (): Promise<Payload[]> => {
        return ApiService.pendingPayloads
            .get()
            .then(async (res: { payloads: PayloadType[] }) => {
                const { payloads } = res;

                PushNotificationsService.updateBadge(payloads.length);

                if (!isEmpty(payloads)) {
                    const result = await Promise.all(flatMap(payloads, Payload.from));
                    return result;
                }

                return [];
            })
            .catch((error: string): any => {
                this.logger.error('Fetch Pending Payloads Error: ', error);
                return [];
            });
    };

    /*
    add use to the xumm
    */
    initUser = async (): Promise<any> => {
        return new Promise((resolve, reject) => {
            ApiService.addUser
                .post()
                .then((res: any) => {
                    if (!res) {
                        throw new Error('Cannot add the device to the XUMM');
                    }
                    return resolve(res);
                })
                .catch((e: any) => {
                    return reject(e);
                });
        });
    };

    /*
    Active a device in xumm
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
                .then((res: any) => {
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

    /*
    Ping with the backend and update the profile
    */
    ping = async () => {
        return ApiService.ping
            .post(null, {
                appVersion: GetAppReadableVersion(),
                appLanguage: Localize.getCurrentLocale(),
                appCurrency: CoreRepository.getAppCurrency(),
                devicePushToken: await PushNotificationsService.getToken(),
            })
            .then((res: any) => {
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

                if (badge) {
                    PushNotificationsService.updateBadge(badge);
                }
            })
            .catch((e: any) => {
                this.logger.error('Ping Backend Error: ', e);
            });
    };

    /*
    Get details for an XRP address
    */
    getAddressInfo = (address: string) => {
        return ApiService.addressInfo.get(address, null, { 'X-XummNet': SocketService.chain });
    };

    /*
    Look up on username's and addresses
    */
    lookup = (content: string) => {
        return ApiService.lookup.get(content, null, { 'X-XummNet': SocketService.chain });
    };

    /*
    get account risk on account advisory
    */
    getAccountRisk = (address: string) => {
        return ApiService.accountAdvisory.get(address);
    };

    getXAppShortList = () => {
        return ApiService.xAppsShortList.get({ featured: true });
    };

    getXAppLaunchToken = (xAppId: string, data: any) => {
        return ApiService.xAppLaunch.post({ xAppId }, data);
    };

    getCurrenciesList = () => {
        const locale = Localize.getCurrentLocale();
        return ApiService.currencies.get({ locale });
    };

    getEndpointDetails = (hash: string) => {
        return ApiService.validEndpoints.get({ hash });
    };

    auditTrail = (destination: string, reason: { reason: string }) => {
        return ApiService.auditTrail.post({ destination }, reason);
    };

    getTranslation = (uuid: string) => {
        return ApiService.translation.get({ uuid });
    };

    getCurrencyRate = (currency: string) => {
        return new Promise((resolve, reject) => {
            // prevent unnecessary requests
            if (this.latestCurrencyRate && this.latestCurrencyRate.code === currency) {
                // calculate passed seconds from the latest sync
                const passedSeconds = moment().diff(moment.unix(this.latestCurrencyRate.lastSync), 'second');

                // if the latest rate fetch is already less than 60 second return cached value
                if (passedSeconds <= 60) {
                    resolve(this.latestCurrencyRate);
                    return;
                }
            }

            // fetch/update the rate from backend
            ApiService.rates
                .get({ currency })
                .then((response: any) => {
                    const rate = get(response, 'XRP');
                    const symbol = get(response, '__meta.currency.symbol');

                    this.latestCurrencyRate = {
                        code: currency,
                        symbol,
                        lastRate: rate,
                        lastSync: moment().unix(),
                    };
                    resolve(this.latestCurrencyRate);
                })
                .catch(reject);
        });
    };
}

export default new BackendService();
