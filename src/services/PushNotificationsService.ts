/**
 * Push Notification service
 * handle push notification permission and received notifications
 */
import { get } from 'lodash';
import { Alert, Platform } from 'react-native';

import firebase, { RNFirebase } from 'react-native-firebase';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Payload } from '@common/libs/payload';

import NavigationService from '@services/NavigationService';
import LoggerService from '@services/LoggerService';

import Localize from '@locale';

import EventEmitter from 'events';

// events
declare interface PushNotificationsService {
    on(event: 'signRequestUpdate', listener: () => void): this;
    on(event: string, listener: Function): this;
}

class PushNotificationsService extends EventEmitter {
    initialized: boolean;
    logger: any;

    constructor() {
        super();
        this.initialized = false;
        this.logger = LoggerService.createLogger('Push');
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
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
                    .catch(e => {
                        return reject(e);
                    });
            } catch (e) {
                return reject(e);
            }
        });
    };

    setBadge = async (badge?: number) => {
        // this.badge = badge;
        // set badge count on tabbar
        if (typeof badge !== 'undefined') {
            await firebase.notifications().setBadge(badge);
            Navigator.setBadge(AppScreens.TabBar.Events, badge === 0 ? '' : badge.toString());
        } else {
            const appBadge = await firebase.notifications().getBadge();
            Navigator.setBadge(AppScreens.TabBar.Events, appBadge === 0 ? '' : appBadge.toString());
        }
    };

    onPermissionGranted = async () => {
        if (!this.initialized) {
            this.prepareNotifications();
            this.createNotificationListeners();
            this.checkInitialNotification();
            this.initialized = true;
        }
    };

    checkPermission = async (): Promise<boolean> => {
        const enabled = await firebase.messaging().hasPermission();
        if (enabled) {
            const token = await this.getToken();
            return !!token;
        }
        return false;
    };

    getToken = (): Promise<string> => {
        return firebase
            .messaging()
            .getToken()
            .then(token => {
                return token;
            })
            .catch(e => {
                this.logger.error('Cannot get token from firebase', e);
                return undefined;
            });
    };

    requestPermission = async (): Promise<boolean> => {
        try {
            await firebase.messaging().requestPermission();
            const token = await this.getToken();
            this.onPermissionGranted();
            return !!token;
        } catch (error) {
            /* User has rejected permissions */
            return false;
        }
    };

    prepareNotifications = () => {
        /* istanbul ignore next */
        if (Platform.OS === 'android') {
            const channel = new firebase.notifications.Android.Channel(
                'notifications',
                'notifications',
                firebase.notifications.Android.Importance.Max,
            ).setDescription('Get urgent notifications/sign requests');
            firebase.notifications().android.createChannel(channel);
        }

        if (Platform.OS === 'ios') {
            firebase.messaging().ios.registerForRemoteNotifications();
        }
    };

    createNotificationListeners = async () => {
        await firebase.messaging().getToken();

        firebase.notifications().onNotification(this.handleNotification);
        firebase.notifications().onNotificationOpened(this.handleNotificationOpen);
    };

    isSignRequest = (notification: RNFirebase.notifications.Notification) => {
        return get(notification, ['data', 'category']) === 'SIGNTX';
    };

    /* If the app was launched by a push notification  */
    checkInitialNotification = () => {
        // check init notification after moving to default stack
        NavigationService.on('setRoot', async (root: string) => {
            if (root === 'DefaultStack') {
                const notificationOpen = await firebase.notifications().getInitialNotification();
                if (notificationOpen) {
                    this.handleNotificationOpen(notificationOpen);
                }
            }
        });
    };

    /* Handle notifications within the app when app is running in foreground */
    handleNotification = (notification: RNFirebase.notifications.Notification) => {
        this.logger.debug('New Notification received', {
            data: notification.data,
            body: notification.body,
            title: notification.title,
        });

        if (this.isSignRequest(notification)) {
            // show the notification
            if (Platform.OS === 'android') {
                notification.android.setChannelId('notifications');
                notification.android.setSmallIcon('ic_stat_icon_xumm_android_notification');
                notification.android.setLargeIcon('ic_stat_icon_xumm_android_notification');
            }

            if (Platform.OS === 'ios') {
                notification.setSound('default');
            }

            firebase.notifications().displayNotification(notification);
            // emit event the sign request
            this.emit('signRequestUpdate');
        }

        // update badge
        this.setBadge();
    };

    /* Handle notifications when app is open from the notification */
    handleNotificationOpen = (notificationOpen: RNFirebase.notifications.NotificationOpen) => {
        const { notification } = notificationOpen;

        if (!notification) return;

        firebase.notifications().removeDeliveredNotification(notification.notificationId);

        if (this.isSignRequest(notification)) {
            // get payload uuid
            const payloadUUID = get(notification, ['data', 'payload']);

            if (payloadUUID) {
                Payload.from(payloadUUID)
                    .then(payload => {
                        // show review transaction screen
                        Navigator.showModal(
                            AppScreens.Modal.ReviewTransaction,
                            { modalPresentationStyle: 'fullScreen' },
                            {
                                payload,
                            },
                        );
                    })
                    .catch(e => {
                        Alert.alert(Localize.t('global.error'), e.message);
                        this.logger.error('Cannot fetch payload from backend', payloadUUID);
                    });
            }
        }
    };
}

export default new PushNotificationsService();
