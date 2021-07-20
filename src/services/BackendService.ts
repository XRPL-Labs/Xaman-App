/**
 * Backend service
 * Interact with xumm backend
 */

import { map, isEmpty, flatMap, get } from 'lodash';
import moment from 'moment-timezone';

import { Platform } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetAppReadableVersion, GetDeviceUniqueId } from '@common/helpers/device';

import { CurrencySchema } from '@store/schemas/latest';

import { CoreRepository } from '@store/repositories';
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
    private currencyRate: any;

    constructor() {
        this.logger = LoggerService.createLogger('Backend');

        this.currencyRate = undefined;
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // sync the details after moving to default stack
                NavigationService.on('setRoot', (root: string) => {
                    if (root === RootType.DefaultRoot) {
                        this.sync();
                    }
                });

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    /*
    Start syncing with all stuff with backend
    */
    sync = async () => {
        this.logger.debug('Start Syncing with backend');
        await this.syncCuratedIous();
        // await this.syncContacts();
    };

    /*
    Sync the contacts
    */
    // syncContacts = () => {
    // this.logger.debug('Syncing contacts ...');
    // };

    /*
    Update IOUs from backend
    */
    syncCuratedIous = async () => {
        ApiService.curatedIOUs
            .get()
            .then((res: any) => {
                const { details } = res;

                // clear the CounterParty store
                CounterPartyRepository.deleteAll();

                map(details, async (value) => {
                    const normalizedList = [] as CurrencySchema[];

                    await Promise.all(
                        map(value.currencies, async (c) => {
                            const currency = await CurrencyRepository.include({
                                issuer: c.issuer,
                                currency: c.currency,
                                name: c.name,
                                avatar: c.avatar || '',
                                shortlist: c.shortlist === 1,
                            });

                            normalizedList.push(currency);
                        }),
                    );

                    CounterPartyRepository.create(
                        {
                            id: value.id,
                            name: value.name,
                            domain: value.domain,
                            avatar: value.avatar || '',
                            shortlist: value.shortlist === 1,
                            currencies: normalizedList,
                        },
                        true,
                    );
                });
            })
            .catch((error: string) => {
                this.logger.error('Fetch Curated Ious Error: ', error);
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
    ping = () => {
        /* eslint-disable-next-line */
        return new Promise<void>(async (resolve, reject) => {
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
                                {
                                    modalPresentationStyle: 'fullScreen',
                                    modal: {
                                        swipeToDismiss: false,
                                    },
                                },
                                { asModal: true },
                            );
                        }
                    }

                    if (badge) {
                        PushNotificationsService.updateBadge(badge);
                    }

                    return resolve();
                })
                .catch((e: any) => {
                    this.logger.error('Ping Backend Error: ', e);
                    return resolve();
                });
        });
    };

    /*
    Get details for an xrp address
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
        return ApiService.xAppsShortList.get();
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
            if (this.currencyRate && this.currencyRate.code === currency) {
                const passedSeconds = moment().diff(moment.unix(this.currencyRate.lastSync), 'second');

                // cache currency rate for 60 seconds
                if (passedSeconds <= 60) {
                    resolve(this.currencyRate);
                    return;
                }
            }

            // update the rate from backend
            ApiService.rates
                .get({ currency })
                .then((r: any) => {
                    const rate = get(r, 'XRP');
                    const symbol = get(r, '__meta.currency.symbol');

                    this.currencyRate = {
                        code: currency,
                        symbol,
                        lastRate: rate,
                        lastSync: moment().unix(),
                    };
                    resolve(this.currencyRate);
                })
                .catch(reject);
        });
    };
}

export default new BackendService();
