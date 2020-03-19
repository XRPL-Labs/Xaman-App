/**
 * Sync service
 * Sync Stuff with XUMM Backend
 */

import { v4 as uuidv4 } from 'uuid';
import { map, isEmpty, flatMap } from 'lodash';

import { Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers';

import { CurrencySchema } from '@store/schemas/latest';
import { ProfileRepository, CounterPartyRepository, CurrencyRepository } from '@store/repositories';

import { Payload, PayloadType } from '@common/libs/payload';
import { LoggerService, ApiService, NavigationService, PushNotificationsService } from '@services';

// Locale
import Localize from '@locale';

class BackendService {
    accounts: string[];
    logger: any;

    constructor() {
        this.accounts = [];
        this.logger = LoggerService.createLogger('Backend');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                // sync the details after moving to default stack
                NavigationService.on('setRoot', (root: string) => {
                    if (root === 'DefaultStack') {
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
        await this.ping();
        await this.syncCuratedIous();
        await this.syncContacts();
    };

    /*
    Sync the contacts
    */
    syncContacts = () => {
        this.logger.debug('Syncing contacts ...');
    };

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

                map(details, async value => {
                    const normalizedList = [] as CurrencySchema[];

                    await Promise.all(
                        map(value.currencies, async c => {
                            const currency = await CurrencyRepository.upsert(
                                {
                                    id: uuidv4(),
                                    issuer: c.issuer,
                                    currency: c.currency,
                                    name: c.name,
                                    avatar: c.avatar || '',
                                },
                                {
                                    issuer: c.issuer,
                                    currency: c.currency,
                                },
                            );

                            normalizedList.push(currency);
                        }),
                    );

                    CounterPartyRepository.create(
                        {
                            id: value.id,
                            name: value.name,
                            domain: value.domain,
                            avatar: value.avatar || '',
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

                PushNotificationsService.setBadge(payloads.length);

                if (!isEmpty(payloads)) {
                    const result = await Promise.all(flatMap(payloads, Payload.from));
                    return result;
                }

                return [];
            })
            .catch((error: string) => {
                this.logger.error('Fetch Pending Payloads Error: ', error);
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
                        uniqueDeviceIdentifier: DeviceInfo.getUniqueId(),
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
        return ApiService.ping
            .post(null, { appVersion: DeviceInfo.getReadableVersion(), appLanguage: Localize.getCurrentLocale() })
            .then((res: any) => {
                const { auth, badge, tosAndPrivacyPolicyVersion } = res;

                if (auth) {
                    const { user } = auth;

                    // update the profile
                    ProfileRepository.saveProfile({
                        username: user.name,
                        slug: user.slug,
                        uuid: user.uuidv4,
                        lastSync: new Date(),
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
                    PushNotificationsService.setBadge(badge);
                }
            })
            .catch((error: string) => {
                this.logger.error('Ping Backend Error: ', error);
            });
    };

    /*
    Get details for an xrp address
    */
    getAddressInfo = (address: string) => {
        return ApiService.addressInfo.get(address);
    };

    /*
    Look up on username's and addresses
    */
    lookup = (content: string) => {
        return ApiService.lookup.get(content);
    };

    /*
    get account risk on account advisory
    */
    getAccountRisk = (address: string) => {
        return ApiService.accountAdvisory.get(address);
    };
}

export default new BackendService();
