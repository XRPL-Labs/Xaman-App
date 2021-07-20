/**
 * Push Notification service
 * handle push notification permission and received notifications
 */
import { get, isEqual } from 'lodash';
import EventEmitter from 'events';

import { Alert, NativeModules } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { utils } from 'xrpl-accountlib';

import { AccountRepository } from '@store/repositories';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload, PayloadOrigin } from '@common/libs/payload';

import LoggerService from '@services/LoggerService';
import NavigationService, { ComponentTypes } from '@services/NavigationService';

import Localize from '@locale';

/* Constants  ==================================================================== */
const { LocalNotificationModule } = NativeModules;

// events
declare interface PushNotificationsService {
    on(event: 'signRequestUpdate', listener: () => void): this;
    on(event: string, listener: Function): this;
}

export enum NotificationType {
    SignRequest = 'SignRequest',
    OpenXApp = 'OpenXApp',
    OpenTx = 'OpenTx',
}

/* Service  ==================================================================== */
class PushNotificationsService extends EventEmitter {
    initialized: boolean;
    initialNotification: FirebaseMessagingTypes.RemoteMessage;
    logger: any;

    constructor() {
        super();
        this.initialized = false;
        this.initialNotification = undefined;
        this.logger = LoggerService.createLogger('Push');
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                return this.checkPermission()
                    .then((hasPermission: boolean) => {
                        if (hasPermission) {
                            this.onPermissionGranted();
                        } else {
                            this.logger.warn('Push don"t have the right permission');
                        }
                        return resolve();
                    })
                    .catch((e) => {
                        return reject(e);
                    });
            } catch (e) {
                return reject(e);
            }
        });
    };

    updateBadge = async (badge?: number) => {
        // this.badge = badge;
        // set badge count on tabbar
        if (typeof badge !== 'undefined') {
            await LocalNotificationModule.setBadge(badge);
            Navigator.setBadge(AppScreens.TabBar.Events, badge === 0 ? '' : badge.toString());
        } else {
            const appBadge = await LocalNotificationModule.getBadge();
            Navigator.setBadge(AppScreens.TabBar.Events, appBadge === 0 ? '' : appBadge.toString());
        }
    };

    onPermissionGranted = async () => {
        if (!this.initialized) {
            this.createNotificationListeners();
            this.initialized = true;
        }
    };

    checkPermission = async (): Promise<boolean> => {
        const authStatus = await messaging().hasPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            const token = await this.getToken();
            return !!token;
        }
        return false;
    };

    getToken = (): Promise<string> => {
        return messaging()
            .getToken()
            .then((token) => {
                return token;
            })
            .catch((e) => {
                this.logger.error('Cannot get token from firebase', e);
                return undefined;
            });
    };

    requestPermission = async (): Promise<boolean> => {
        try {
            const authStatus = await messaging().requestPermission();

            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                const token = await this.getToken();
                if (token) {
                    this.onPermissionGranted();
                    return true;
                }
            }

            return false;
        } catch (error) {
            return false;
        }
    };

    createNotificationListeners = async () => {
        await messaging().getToken();

        messaging().onMessage(this.handleNotification);
        messaging().onNotificationOpenedApp(this.handleNotificationOpen);
    };

    getType = (notification: any): NotificationType => {
        const category = get(notification, ['data', 'category']);
        switch (category) {
            case 'SIGNTX':
                return NotificationType.SignRequest;
            case 'OPENXAPP':
                return NotificationType.OpenXApp;
            case 'TXPUSH':
                return NotificationType.OpenTx;
            default:
                return undefined;
        }
    };

    isSignRequest = (notification: any) => {
        return get(notification, ['data', 'category']) === 'SIGNTX';
    };

    /* If the app was launched by a push notification  */
    checkInitialNotification = async () => {
        const initialNotification = await messaging().getInitialNotification();

        if (initialNotification && !isEqual(this.initialNotification, initialNotification)) {
            this.initialNotification = initialNotification;
            this.handleNotificationOpen(initialNotification);
        }
    };

    /* Handle notifications within the app when app is running in foreground */
    handleNotification = (message: FirebaseMessagingTypes.RemoteMessage) => {
        const shouldShowNotification = NavigationService.getCurrentModal() !== AppScreens.Modal.ReviewTransaction;

        LocalNotificationModule.complete(message.messageId, shouldShowNotification);

        // emit the event so we can update the event list
        this.emit('signRequestUpdate');

        // update badge
        this.updateBadge();
    };

    routeUser = async (screen: string, options: any, passProps: any, screenType?: ComponentTypes) => {
        // close any overlay
        const currentOverlay = NavigationService.getCurrentOverlay();

        if (currentOverlay && currentOverlay !== AppScreens.Overlay.Lock) {
            // dismiss overlay
            await Navigator.dismissOverlay();
        }

        if (!screenType) {
            screenType = NavigationService.getComponentType(screen);
        }

        if (screenType === ComponentTypes.Modal) {
            setTimeout(() => {
                Navigator.showModal(screen, options, passProps);
            }, 10);
        } else if (screenType === ComponentTypes.Screen) {
            setTimeout(() => {
                Navigator.push(screen, options, passProps);
            }, 10);
        }
    };

    handleSingRequest = async (notification: any) => {
        const payloadUUID = get(notification, ['data', 'payload']);

        if (!payloadUUID) return;

        await Payload.from(payloadUUID, PayloadOrigin.PUSH_NOTIFICATION)
            .then((payload) => {
                // show review transaction screen
                this.routeUser(
                    AppScreens.Modal.ReviewTransaction,
                    { modalPresentationStyle: 'fullScreen' },
                    {
                        payload,
                    },
                    ComponentTypes.Modal,
                );
            })
            .catch((e) => {
                Alert.alert(Localize.t('global.error'), e.message);
                this.logger.error('Cannot fetch payload from backend', payloadUUID);
            });
    };

    handleOpenXApp = async (notification: any) => {
        const xappIdentifier = get(notification, ['data', 'xappIdentifier']);
        const xappTitle = get(notification, ['data', 'xappTitle']);

        if (!xappIdentifier) return;

        let delay = 0;

        // if already in xapp try to load the xApp from notification and close the current one
        if (NavigationService.getCurrentModal() === AppScreens.Modal.XAppBrowser) {
            await Navigator.dismissModal();
            // looks like a bug in navigation library, need to add a delay before showing the modal
            delay = 300;
        }

        setTimeout(() => {
            // show review transaction screen
            this.routeUser(
                AppScreens.Modal.XAppBrowser,
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                {
                    identifier: xappIdentifier,
                    title: xappTitle,
                    origin: PayloadOrigin.PUSH_NOTIFICATION,
                    originData: get(notification, 'data'),
                },
                ComponentTypes.Modal,
            );
        }, delay);
    };

    handleOpenTx = async (notification: any) => {
        const hash = get(notification, ['data', 'tx']);
        const address = get(notification, ['data', 'account']);

        // validate inputs
        if (!utils.isValidAddress(address) || !new RegExp('^[A-F0-9]{64}$', 'i').test(hash)) return;

        // check if account exist in xumm
        const account = AccountRepository.findOne({ address });
        if (!account) return;

        let delay = 0;

        // if already in transaction details and modal then close it
        // in  rare case if user is already in transaction details screen then
        // the screen is not modal so xumm will ignore showing the tx details screen
        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();

            // looks like a bug in navigation library, need to add a delay before showing the modal
            delay = 300;
        }

        setTimeout(() => {
            this.routeUser(AppScreens.Transaction.Details, {}, { hash, account, asModal: true }, ComponentTypes.Modal);
        }, delay);
    };

    /* Handle notifications when app is open from the notification */
    handleNotificationOpen = (notification: any) => {
        if (!notification) return;

        switch (this.getType(notification)) {
            case NotificationType.SignRequest:
                this.handleSingRequest(notification);
                break;
            case NotificationType.OpenXApp:
                this.handleOpenXApp(notification);
                break;
            case NotificationType.OpenTx:
                this.handleOpenTx(notification);
                break;
            default:
                break;
        }
    };
}

export default new PushNotificationsService();
