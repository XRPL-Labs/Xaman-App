/**
 * Navigation service
 * Subscribe to navigation events
 */

import EventEmitter from 'events';
import { last, take, values } from 'lodash';

import { BackHandler, Platform } from 'react-native';

import analytics from '@react-native-firebase/analytics';

import {
    Navigation,
    ComponentDidAppearEvent,
    BottomTabLongPressedEvent,
    BottomTabPressedEvent,
} from 'react-native-navigation';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { ExitApp } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import Locale from '@locale';

/* Types  ==================================================================== */
export enum ComponentTypes {
    Screen = 'SCREEN',
    Modal = 'MODAL',
    TabBar = 'TABBAR',
    Overlay = 'OVERLAY',
    Unknown = 'UNKNOWN',
}

/* Service  ==================================================================== */
class NavigationService extends EventEmitter {
    screens: Array<string>;
    currentRoot: string;
    currentScreen: string;
    overlays: Array<string>;
    backHandlerClickCount: number;

    constructor() {
        super();

        this.currentRoot = '';
        this.currentScreen = '';
        this.screens = [];
        this.overlays = [];
        this.backHandlerClickCount = 0;
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // enable firebase analytics collection
                analytics().setAnalyticsCollectionEnabled(true);
                // navigation event listeners
                Navigation.events().registerComponentDidAppearListener(this.componentDidAppear);
                Navigation.events().registerCommandListener(this.navigatorCommandListener);
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
                        const currentOverlay = this.getCurrentOverlay();
                        if (currentOverlay !== AppScreens.Overlay.HomeActions) {
                            Navigation.showOverlay({
                                component: {
                                    name: AppScreens.Overlay.HomeActions,
                                    id: AppScreens.Overlay.HomeActions,
                                    passProps: {},
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

    // track tabbar screen change
    componentDidAppear = ({ componentName }: ComponentDidAppearEvent) => {
        // // only apply for tabbar
        if (this.getComponentType(componentName) === ComponentTypes.TabBar) {
            this.setCurrentScreen(componentName);
        }
    };

    navigatorCommandListener = (name: string, params: any) => {
        switch (name) {
            case 'push':
                this.setCurrentScreen(params.layout.data.name);
                break;
            case 'showModal':
                this.setCurrentScreen(params.layout.children[0].id);
                break;
            case 'showOverlay':
                this.setCurrentOverlay(params.layout.id);
                break;
            case 'dismissModal':
            case 'pop':
                this.setPrevScreen();
                break;
            case 'setRoot':
                this.setCurrentRoot(params.layout.root.id);
                this.setCurrentScreen(params.layout.root.children[0].children[0].id);
                this.emit('setRoot', params.layout.root.id);
                break;
            default:
                break;
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
            ExitApp();
        }
    };

    getCurrentScreen = (): string => {
        return this.currentScreen;
    };

    setCurrentScreen = (currentScreen: string) => {
        if (this.currentScreen !== currentScreen) {
            analytics().logScreenView({ screen_name: currentScreen });

            this.recordHistory(currentScreen);

            this.currentScreen = currentScreen;
        }
    };

    setCurrentOverlay = (currentOverlay: string) => {
        if (last(this.overlays) !== currentOverlay) {
            analytics().logScreenView({ screen_name: currentOverlay });

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

    setPrevScreen = () => {
        // remove the screen
        this.screens.pop();
        // set the last screen as current screen
        this.currentScreen = last(this.screens);
    };

    recordHistory = (screen: string) => {
        const prevScreenType = this.getComponentType(last(this.screens));
        const currentScreenType = this.getComponentType(screen);

        if (prevScreenType !== ComponentTypes.TabBar || currentScreenType !== ComponentTypes.TabBar) {
            this.screens.push(screen);
        }

        if (prevScreenType === ComponentTypes.TabBar && currentScreenType === ComponentTypes.TabBar) {
            this.screens[this.screens.length - 1] = screen;
        }
    };

    getComponentType = (component: string) => {
        if (!component) return ComponentTypes.Unknown;

        if (component.startsWith('modal.')) {
            return ComponentTypes.Modal;
        }

        if (component.startsWith('overlay.')) {
            return ComponentTypes.Overlay;
        }

        if (component.startsWith('app.TabBar')) {
            return ComponentTypes.TabBar;
        }

        return ComponentTypes.Screen;
    };
}

export default new NavigationService();
