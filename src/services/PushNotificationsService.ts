/**
 * Push Notification service
 * handle push notification permission and received notifications
 */

import { get, isEqual } from 'lodash';
import EventEmitter from 'events';

import { Alert, NativeModules, Platform } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { utils } from 'xrpl-accountlib';

import { AccountRepository } from '@store/repositories';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload, PayloadOrigin, XAppOrigin } from '@common/libs/payload';

import LoggerService from '@services/LoggerService';
import NavigationService, { ComponentTypes } from '@services/NavigationService';

import { StringTypeCheck } from '@common/utils/string';

import Localize from '@locale';

/* Constants  ==================================================================== */
const { LocalNotificationModule } = NativeModules;

/* Types  ==================================================================== */
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

        // Do not double listen for notifications
        this.initialized = false;
        // First app cold lunch notifications
        this.initialNotification = undefined;

        this.logger = LoggerService.createLogger('Push');
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // check if we have right permissions
                this.checkPermission()
                    .then((hasPermission: boolean) => {
                        if (hasPermission) {
                            // if so move forward
                            this.onPermissionGranted();
                        } else {
                            this.logger.warn('Push don"t have the right permission or unable to get FCM token');
                        }
                        resolve();
                    })
                    .catch((e) => {
                        reject(e);
                    });
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * Update and persists badge count
     * @param badge - badge count in number
     */
    updateBadge = async (badge?: number): Promise<void> => {
        if (typeof badge !== 'number') {
            this.logger.warn(`expected number for badge count but received "${typeof badge}"`);
            return;
        }

        // persist the badge count
        await LocalNotificationModule.setBadge(badge).catch((error: any): void => {
            this.logger.warn('LocalNotificationModule setBadge', error);
        });

        // update the TabBar Events badge count
        Navigator.setBadge(AppScreens.TabBar.Events, badge === 0 ? '' : String(badge));
    };

    /**
     * Called when push notification got the right permission access
     * will create necessary notifications listeners
     */
    onPermissionGranted = (): void => {
        if (!this.initialized) {
            this.createNotificationListeners();
            this.initialized = true;
        }
    };

    /**
     * Check if we have right notification permissions && We are able to get the FCM token
     * @returns {Promise<boolean>} - result of the check in boolean
     */
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

    /**
     * Request permission for notifications
     * @returns {Promise<boolean>} - results of permission request
     */
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

    /**
     * Create listeners for incoming notifications
     */
    createNotificationListeners = (): void => {
        messaging().onMessage(this.handleNotification);
        messaging().onNotificationOpenedApp(this.handleNotificationOpen);
    };

    /**
     * Fetch FCM token from firebase
     * @returns {Promise<string>} - firebase FCM token in string
     */
    getToken = async (): Promise<string> => {
        try {
            const token = await messaging().getToken();
            return token;
        } catch (error) {
            this.logger.error('Cannot get FCM token from firebase', error);
            return undefined;
        }
    };

    /**
     * Get notification type or category
     *  - Types
     *    - SIGNTX: Sign Payloads
     *    - OPENXAPP: Opening xApp
     *    - TXPUSH: Opening transaction details
     * @param notification - FirebaseMessagingTypes.RemoteMessage
     * @returns {NotificationType}
     */
    getType = (notification: { data: { category: 'SIGNTX' | 'OPENXAPP' | 'TXPUSH' } }): NotificationType => {
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

    /**
     * Check if this a sign request notification
     * @param notification - FirebaseMessagingTypes.RemoteMessage
     * @returns {boolean}
     */
    isSignRequest = (notification: any): boolean => {
        return this.getType(notification) === NotificationType.SignRequest;
    };

    /**
     * Check if the app was launched by a push notification and handle
     */
    checkInitialNotification = () => {
        messaging()
            .getInitialNotification()
            .then((initialNotification) => {
                if (initialNotification && !isEqual(this.initialNotification, initialNotification)) {
                    this.initialNotification = initialNotification;
                    this.handleNotificationOpen(initialNotification);
                }
            })
            .catch((error) => {
                this.logger.error('getInitialNotification', error);
            });
    };

    /**
     * Handle notifications within the app when app is running in foreground
     * @param message - FirebaseMessagingTypes.RemoteMessage
     */
    handleNotification = (message: FirebaseMessagingTypes.RemoteMessage) => {
        // complete the notification and show the notification if necessary
        const shouldShowNotification = NavigationService.getCurrentModal() !== AppScreens.Modal.ReviewTransaction;
        LocalNotificationModule.complete(message.messageId, shouldShowNotification);

        // if any sign request exist then emit the event, this is needed for refreshing the events list
        if (this.isSignRequest(message)) {
            this.emit('signRequestUpdate');
        }

        // update the badge count
        const badgeCount = Platform.select({
            ios: Number(get(message, ['notification', 'ios', 'badge'], 0)),
            android: Number(get(message, ['data', '_badge_count'], 0)),
            default: undefined,
        });

        this.updateBadge(badgeCount);
    };

    /**
     * Route user base different part of the app
     * @param screen - destination screen
     * @param passProps - passed props while routing
     * @param options - screen options
     * @param screenType - screen type
     */
    routeUser = async (screen: string, passProps: any, options: any, screenType?: ComponentTypes) => {
        // check if we need to close any overlay
        const currentOverlay = NavigationService.getCurrentOverlay();

        if (currentOverlay && currentOverlay !== AppScreens.Overlay.Lock) {
            // dismiss any overlay if NOT lock screen
            await Navigator.dismissOverlay();
        }

        // no screen type provided, guessing ...
        if (!screenType) {
            screenType = NavigationService.getComponentType(screen);
        }

        if (screenType === ComponentTypes.Modal) {
            setTimeout(() => {
                Navigator.showModal(screen, passProps, options);
            }, 10);
        } else if (screenType === ComponentTypes.Screen) {
            setTimeout(() => {
                Navigator.push(screen, passProps, options);
            }, 10);
        }
    };

    /**
     * Handle sign request notification
     * @param notification
     */
    handleSingRequest = async (notification: any) => {
        // fetch payload UUID
        const payloadUUID = get(notification, ['data', 'payload']);

        // validate if valid payload UUID
        if (!StringTypeCheck.isValidUUID(payloadUUID)) {
            return;
        }

        await Payload.from(payloadUUID, PayloadOrigin.PUSH_NOTIFICATION)
            .then((payload) => {
                // show review transaction screen
                this.routeUser(
                    AppScreens.Modal.ReviewTransaction,
                    {
                        payload,
                    },
                    { modalPresentationStyle: 'fullScreen' },
                    ComponentTypes.Modal,
                );
            })
            .catch((e) => {
                Alert.alert(Localize.t('global.error'), e.message);
                this.logger.error('Cannot fetch payload from backend', payloadUUID);
            });
    };

    /**
     * Handle opening xApp notification
     * @param notification
     */
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
                    identifier: xappIdentifier,
                    title: xappTitle,
                    origin: XAppOrigin.PUSH_NOTIFICATION,
                    originData: get(notification, 'data'),
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                ComponentTypes.Modal,
            );
        }, delay);
    };

    /**
     * Handle opening transaction details
     * @param notification
     */
    handleOpenTx = async (notification: any) => {
        const hash = get(notification, ['data', 'tx']);
        const address = get(notification, ['data', 'account']);
        const network = get(notification, ['data', 'network']);

        // validate inputs
        if (!utils.isValidAddress(address) || !StringTypeCheck.isValidHash(hash)) {
            return;
        }

        // check if account exist in Xaman
        const account = AccountRepository.findOne({ address });

        // account is not present in the app, just return
        if (!account) return;

        let delay = 0;

        // if already in transaction details and modal then close it
        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();
            // looks like a bug in navigation library, need to add a delay before showing the modal
            delay = 300;
        }

        // if already in transaction details and screen then pop back
        if (NavigationService.getCurrentScreen() === AppScreens.Transaction.Details) {
            await Navigator.pop();
            // looks like a bug in navigation library, need to add a delay before showing the modal
            delay = 300;
        }

        setTimeout(() => {
            this.routeUser(AppScreens.Modal.TransactionLoader, { hash, account, network }, {}, ComponentTypes.Modal);
        }, delay);
    };

    /**
     * Handle notifications when app is open from the notification
     * @param notification
     */
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
