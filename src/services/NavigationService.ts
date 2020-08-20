/**
 * Navigation service
 * Subscribe to navigation events
 */

import EventEmitter from 'events';
import { last, take, values } from 'lodash';

import { BackHandler, Platform, NativeModules } from 'react-native';

import analytics from '@react-native-firebase/analytics';

import {
    Navigation,
    ComponentDidAppearEvent,
    BottomTabLongPressedEvent,
    BottomTabPressedEvent,
    ModalDismissedEvent,
    OptionsModalPresentationStyle,
    OptionsModalTransitionStyle,
} from 'react-native-navigation';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import Locale from '@locale';

/* Service  ==================================================================== */
class NavigationService extends EventEmitter {
    prevScreen: string;
    currentRoot: string;
    currentScreen: string;
    overlays: Array<string>;
    backHandlerClickCount: number;

    constructor() {
        super();

        this.prevScreen = '';
        this.currentRoot = '';
        this.currentScreen = '';
        this.overlays = [];
        this.backHandlerClickCount = 0;
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                // enable firebase analytics collection
                analytics().setAnalyticsCollectionEnabled(true);
                // navigation event listeners
                Navigation.events().registerComponentDidAppearListener(this.componentDidAppear);
                Navigation.events().registerCommandListener(this.navigatorCommandListener);
                Navigation.events().registerModalDismissedListener(this.modalDismissedListener);
                Navigation.events().registerBottomTabLongPressedListener(
                    ({ selectedTabIndex }: BottomTabLongPressedEvent) => {
                        if (selectedTabIndex === 0) {
                            const currentOverlay = this.getCurrentOverlay();
                            if (currentOverlay !== AppScreens.Overlay.SwitchAccount) {
                                // haptic vibrate
                                VibrateHapticFeedback('impactLight');
                                // show switch account overlay
                                Navigation.showOverlay({
                                    component: {
                                        name: AppScreens.Overlay.SwitchAccount,
                                        id: AppScreens.Overlay.SwitchAccount,
                                        options: {
                                            layout: {
                                                backgroundColor: 'transparent',
                                                componentBackgroundColor: 'transparent',
                                            },
                                        },
                                    },
                                });
                            }
                        }
                    },
                );
                Navigation.events().registerBottomTabPressedListener(({ tabIndex }: BottomTabPressedEvent) => {
                    if (tabIndex === 2) {
                        const currentScreen = this.getCurrentScreen();
                        if (currentScreen !== AppScreens.Modal.Scan) {
                            Navigation.showModal({
                                stack: {
                                    children: [
                                        {
                                            component: {
                                                name: AppScreens.Modal.Scan,
                                                id: AppScreens.Modal.Scan,
                                                options: {
                                                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                                                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                                                },
                                            },
                                        },
                                    ],
                                },
                            });
                        }
                    }
                });

                // set android back handler
                if (Platform.OS === 'android') {
                    this.setBackHandlerListener();
                }

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    componentDidAppear = ({ componentName }: ComponentDidAppearEvent) => {
        // ignore overlay
        if (componentName.indexOf('overlay.') === -1) {
            this.setCurrentScreen(componentName);
        }
    };

    navigatorCommandListener = (name: string, params: any) => {
        switch (name) {
            case 'showOverlay':
                this.setCurrentOverlay(params.layout.id);
                break;

            case 'setRoot':
                this.setCurrentRoot(params.layout.root.id);
                this.emit('setRoot', params.layout.root.id);
                break;
            default:
                break;
        }
    };

    modalDismissedListener = ({ componentId }: ModalDismissedEvent) => {
        if (componentId !== this.getPrevScreen()) {
            this.setCurrentScreen(this.getPrevScreen());
        }
    };

    setBackHandlerListener = () => {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
    };

    handleBackButton = () => {
        // check if we are in main screens and can exit the app
        const currentScreen = this.getCurrentScreen();
        const currentOverlay = this.getCurrentOverlay();

        // first check for overlays
        if (currentOverlay && currentOverlay !== AppScreens.Overlay.Lock) {
            // pull current overlay
            this.pullCurrentOverlay();
            // dismiss overlay
            Navigation.dismissOverlay(currentOverlay);
            return true;
        }

        // check if we are in main screens and can exit the app
        const mainScreens = [AppScreens.Onboarding, ...values(AppScreens.TabBar)];
        if (mainScreens.indexOf(currentScreen) > -1) {
            // increase back handler click count
            this.backHandlerClickCount += 1;

            // check if we need to exist the app
            if (this.backHandlerClickCount < 2) {
                Toast(Locale.t('global.pressBackAgainToExit'), 2000);
                // timeout for fade and exit
                setTimeout(() => {
                    this.backHandlerClickCount = 0;
                }, 2000);

                return true;
            }

            // kill the app
            this.exitApp();

            return false;
        }

        return false;
    };

    exitApp = (soft?: boolean) => {
        if (soft) {
            BackHandler.exitApp();
        } else {
            const { UtilsModule } = NativeModules;
            UtilsModule.exitApp();
        }
    };

    getCurrentScreen = (): string => {
        return this.currentScreen;
    };

    setCurrentScreen = (currentScreen: string) => {
        if (this.currentScreen !== currentScreen) {
            // broadcast to firebase
            analytics().setCurrentScreen(currentScreen, currentScreen);

            this.setPrevScreen(this.currentScreen);
            this.currentScreen = currentScreen;
        }
    };

    setCurrentOverlay = (currentOverlay: string) => {
        if (last(this.overlays) !== currentOverlay) {
            this.overlays.push(currentOverlay);
        }
    };

    getCurrentOverlay = (): string => {
        return last(this.overlays);
    };

    pullCurrentOverlay = (): string => {
        const l = last(this.overlays);
        this.overlays = take(this.overlays, this.overlays.length - 1);
        return l;
    };

    setCurrentRoot = (currentRoot: string) => {
        if (this.currentRoot !== currentRoot) {
            this.currentRoot = currentRoot;
        }
    };

    getCurrentRoot = (): string => {
        return this.currentRoot;
    };

    setPrevScreen = (screen: string) => {
        this.prevScreen = screen;
    };

    getPrevScreen = (): string => {
        return this.prevScreen;
    };
}

export default new NavigationService();
