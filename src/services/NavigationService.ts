/**
 * Navigation service
 * Subscribe to navigation events
 */

import EventEmitter from 'events';
import { get, last, take, values } from 'lodash';

import { BackHandler, Platform } from 'react-native';

import analytics from '@react-native-firebase/analytics';

import {
    Navigation,
    ComponentDidAppearEvent,
    BottomTabLongPressedEvent,
    BottomTabPressedEvent,
    ModalDismissedEvent,
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

export enum RootType {
    OnboardingRoot = 'OnboardingRoot',
    DefaultRoot = 'DefaultRoot',
}

/* Service  ==================================================================== */
class NavigationService extends EventEmitter {
    currentRoot: string;
    currentScreen: string;
    modals: Array<string>;
    overlays: Array<string>;
    backHandlerClickCount: number;
    backHandlerClickCountTimeout: any;

    constructor() {
        super();

        this.currentRoot = '';
        this.currentScreen = '';
        this.modals = [];
        this.overlays = [];
        this.backHandlerClickCount = 0;
        this.backHandlerClickCountTimeout = undefined;
    }

    initialize = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // enable firebase analytics collection
                analytics().setAnalyticsCollectionEnabled(true);
                // navigation event listeners
                Navigation.events().registerComponentDidAppearListener(this.componentDidAppear);
                Navigation.events().registerCommandListener(this.navigatorCommandListener);
                Navigation.events().registerModalDismissedListener(this.modalDismissedListener);
                Navigation.events().registerBottomTabLongPressedListener(this.bottomTabLongPressedListener);
                Navigation.events().registerBottomTabPressedListener(this.bottomTabPressedListener);

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

    bottomTabLongPressedListener = ({ selectedTabIndex }: BottomTabLongPressedEvent) => {
        if (selectedTabIndex !== 0) return;

        const currentOverlay = this.getCurrentOverlay();
        if (currentOverlay !== AppScreens.Overlay.SwitchAccount) {
            // haptic vibrate
            VibrateHapticFeedback('impactLight');
            // show switch account overlay
            Navigation.showOverlay({
                component: {
                    name: AppScreens.Overlay.SwitchAccount,
                    id: AppScreens.Overlay.SwitchAccount,
                    passProps: { componentType: ComponentTypes.Overlay },
                    options: {
                        layout: {
                            backgroundColor: 'transparent',
                            componentBackgroundColor: 'transparent',
                        },
                    },
                },
            });
        }
    };

    bottomTabPressedListener = ({ tabIndex }: BottomTabPressedEvent) => {
        if (tabIndex !== 2) return;

        const currentOverlay = this.getCurrentOverlay();
        if (currentOverlay !== AppScreens.Overlay.HomeActions) {
            Navigation.showOverlay({
                component: {
                    name: AppScreens.Overlay.HomeActions,
                    id: AppScreens.Overlay.HomeActions,
                    passProps: { componentType: ComponentTypes.Overlay },
                    options: {
                        layout: {
                            backgroundColor: 'transparent',
                            componentBackgroundColor: 'transparent',
                        },
                    },
                },
            });
        }
    };

    modalDismissedListener = ({ componentId, componentName }: ModalDismissedEvent) => {
        // on android componentId is stack id and in Ios componentName is undefined
        if (componentName || componentId === last(this.modals)) {
            this.pullCurrentModal();
        }
    };

    onOverlayDismissed = (componentName: string) => {
        if (componentName === last(this.overlays)) {
            this.pullCurrentOverlay();
        }
    };

    componentDidAppear = ({ componentName, passProps }: ComponentDidAppearEvent) => {
        switch (this.getComponentType(componentName)) {
            case ComponentTypes.Modal:
                this.setCurrentModal(componentName);
                break;
            case ComponentTypes.Overlay:
                this.setCurrentOverlay(componentName);
                break;
            case ComponentTypes.Screen:
                // check if screen is presenting as modal
                if (get(passProps, 'componentType') === ComponentTypes.Modal) {
                    this.setCurrentModal(componentName);
                } else {
                    this.setCurrentScreen(componentName);
                }
                break;
            case ComponentTypes.TabBar:
                this.setCurrentScreen(componentName);
                break;
            default:
                break;
        }
    };

    navigatorCommandListener = (name: string, params: any) => {
        switch (name) {
            case 'dismissOverlay':
                this.onOverlayDismissed(params.componentId);
                break;
            case 'setRoot':
                this.onRootChange(params.layout.root.id);
                break;
            default:
                break;
        }
    };

    setBackHandlerListener = () => {
        BackHandler.addEventListener('hardwareBackPress', this.handleAndroidBackButton);
    };

    /**
     * Handle hardware back button on android
     * @returns boolean
     */
    handleAndroidBackButton = () => {
        // check current visible component, priority is with overlays
        const currentOverlay = this.getCurrentOverlay();
        const currentModal = this.getCurrentModal();
        const currentScreen = this.getCurrentScreen();

        // ignore any back button if in the lock screen

        if (currentOverlay === AppScreens.Overlay.Lock) {
            return true;
        }

        // dismiss any overlay
        if (currentOverlay) {
            Navigation.dismissOverlay(currentOverlay);
            return true;
        }

        // check if we are in root components and can exit the app
        if (!currentModal && this.isRootComponent(currentScreen)) {
            // increase back handler click count
            this.backHandlerClickCount += 1;

            // check if we need to exist the app
            if (this.backHandlerClickCount < 2) {
                // show toast notify
                Toast(Locale.t('global.pressBackAgainToExit'), 2000);
                // timeout for fade and exit
                if (this.backHandlerClickCountTimeout) {
                    clearTimeout(this.backHandlerClickCountTimeout);
                }
                this.backHandlerClickCountTimeout = setTimeout(() => {
                    this.backHandlerClickCount = 0;
                }, 2000);

                return true;
            }
            // kill the app if user pressed back 3 times
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
            this.currentScreen = currentScreen;
        }
    };

    setCurrentModal = (modal: string) => {
        if (!this.modals.includes(modal)) {
            analytics().logScreenView({ screen_name: modal });
            this.modals.push(modal);
        }
    };

    getCurrentModal = (): string => {
        return last(this.modals);
    };

    pullCurrentModal = (): string => {
        const l = last(this.modals);
        this.modals = take(this.modals, this.modals.length - 1);

        return l;
    };

    setCurrentOverlay = (overlay: string) => {
        if (last(this.overlays) !== overlay) {
            analytics().logScreenView({ screen_name: overlay });
            this.overlays.push(overlay);
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

    onRootChange = (root: string) => {
        if (this.currentRoot !== root) {
            this.currentRoot = root;
        }

        this.emit('setRoot', root);
    };

    getCurrentRoot = (): string => {
        return this.currentRoot;
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

    isRootComponent = (component: string) => {
        const rootComponents = [AppScreens.Onboarding, ...values(AppScreens.TabBar)];
        return rootComponents.indexOf(component) > -1;
    };
}

export default new NavigationService();
