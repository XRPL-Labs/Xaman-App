/**
 * Navigation service
 * Subscribe to navigation events
 */

import EventEmitter from 'events';
import { get, last, take, debounce } from 'lodash';

import { BackHandler } from 'react-native';

import analytics from '@react-native-firebase/analytics';

import {
    Navigation,
    ComponentDidAppearEvent,
    BottomTabLongPressedEvent,
    BottomTabPressedEvent,
    ModalDismissedEvent,
} from 'react-native-navigation';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { ExitApp } from '@common/helpers/app';

import { AppScreens } from '@common/constants';

import Locale from '@locale';

/* Types  ==================================================================== */
export type AppScreenKeys<T = typeof AppScreens, L0 = T[keyof T]> =
    L0 extends Record<string, any> ? AppScreenKeys<L0> : L0;

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

export type NavigationServiceEvent = {
    setRoot: (root: RootType) => void;
};

declare interface NavigationService {
    on<U extends keyof NavigationServiceEvent>(event: U, listener: NavigationServiceEvent[U]): this;
    off<U extends keyof NavigationServiceEvent>(event: U, listener: NavigationServiceEvent[U]): this;
    emit<U extends keyof NavigationServiceEvent>(event: U, ...args: Parameters<NavigationServiceEvent[U]>): boolean;
}
/* Service  ==================================================================== */
class NavigationService extends EventEmitter {
    private currentRoot?: RootType;
    private currentScreen?: AppScreenKeys;
    private modals: Array<AppScreenKeys>;
    private overlays: Array<AppScreenKeys>;
    private backHandlerClickCount: number;
    private backHandlerClickCountTimeout: any;

    constructor() {
        super();

        this.currentRoot = undefined;
        this.currentScreen = undefined;
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
                Navigation.events().registerBottomTabPressedListener(this.debouncedBottomTabPressedListener);

                // set android back handler
                BackHandler.addEventListener('hardwareBackPress', this.handleAndroidBackButton);

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * reinstate service
     * Clear any prev navigation state
     */
    reinstate = () => {
        this.currentRoot = undefined;
        this.currentScreen = undefined;
        this.modals = [];
        this.overlays = [];
        this.backHandlerClickCount = 0;

        if (this.backHandlerClickCountTimeout) {
            clearTimeout(this.backHandlerClickCountTimeout);
            this.backHandlerClickCountTimeout = undefined;
        }
    };

    bottomTabLongPressedListener = ({ selectedTabIndex }: BottomTabLongPressedEvent) => {
        switch (selectedTabIndex) {
            case 0:
                if (this.getCurrentOverlay() === AppScreens.Overlay.SwitchAccount) {
                    return;
                }
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
                            overlay: {
                                handleKeyboardEvents: true,
                            },
                        },
                    },
                });
                break;
            case 2:
                if (this.getCurrentModal() === AppScreens.Modal.Scan) {
                    return;
                }
                // haptic vibrate
                VibrateHapticFeedback('impactLight');
                // show scan modal
                Navigation.showModal({
                    stack: {
                        id: AppScreens.Modal.Scan,
                        children: [
                            {
                                component: {
                                    name: AppScreens.Modal.Scan,
                                    id: AppScreens.Modal.Scan,
                                    options: {},
                                    passProps: { componentType: ComponentTypes.Modal },
                                },
                            },
                        ],
                    },
                });

                break;
            default:
                break;
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
                        overlay: {
                            handleKeyboardEvents: true,
                        },
                    },
                },
            });
        }
    };

    debouncedBottomTabPressedListener = debounce(this.bottomTabPressedListener, 300, {
        leading: true,
        trailing: false,
    });

    modalDismissedListener = ({ componentId }: ModalDismissedEvent) => {
        // on android componentId is stack id and in Ios componentName is undefined
        if (componentId === last(this.modals)) {
            this.pullCurrentModal();
        }
    };

    onOverlayDismissed = (componentName: AppScreenKeys) => {
        if (componentName === last(this.overlays)) {
            this.pullCurrentOverlay();
        }
    };

    componentDidAppear = ({ componentName, passProps }: ComponentDidAppearEvent) => {
        switch (this.getComponentType(componentName)) {
            case ComponentTypes.Modal:
                this.setCurrentModal(componentName as AppScreenKeys);
                break;
            case ComponentTypes.Overlay:
                this.setCurrentOverlay(componentName as AppScreenKeys);
                break;
            case ComponentTypes.Screen:
                // check if screen is presenting as modal
                if (get(passProps, 'componentType') === ComponentTypes.Modal) {
                    this.setCurrentModal(componentName as AppScreenKeys);
                } else {
                    this.setCurrentScreen(componentName as AppScreenKeys);
                }
                break;
            case ComponentTypes.TabBar:
                this.setCurrentScreen(componentName as AppScreenKeys);
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

    getCurrentScreen = (): AppScreenKeys | undefined => {
        return this.currentScreen;
    };

    setCurrentScreen = (currentScreen: AppScreenKeys) => {
        if (this.currentScreen !== currentScreen) {
            analytics().logScreenView({ screen_name: currentScreen });
            this.currentScreen = currentScreen;
        }
    };

    setCurrentModal = (modal: AppScreenKeys) => {
        if (!this.modals.includes(modal)) {
            analytics().logScreenView({ screen_name: modal });
            this.modals.push(modal);
        }
    };

    getCurrentModal = (): string | undefined => {
        return last(this.modals);
    };

    pullCurrentModal = (): string | undefined => {
        const lastModal = last(this.modals);
        this.modals = take(this.modals, this.modals.length - 1);
        return lastModal;
    };

    setCurrentOverlay = (overlay: AppScreenKeys) => {
        if (last(this.overlays) !== overlay) {
            analytics().logScreenView({ screen_name: overlay });
            this.overlays.push(overlay);
        }
    };

    getCurrentOverlay = (): string | undefined => {
        return last(this.overlays);
    };

    pullCurrentOverlay = (): string | undefined => {
        const lastOverlay = last(this.overlays);
        this.overlays = take(this.overlays, this.overlays.length - 1);
        return lastOverlay;
    };

    onRootChange = (root: RootType) => {
        if (this.currentRoot !== root) {
            this.currentRoot = root;
        }

        this.emit('setRoot', root);
    };

    getCurrentRoot = (): RootType | undefined => {
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

    isRootComponent = (component: any) => {
        return [AppScreens.Onboarding, ...Object.values(AppScreens.TabBar)].indexOf(component) > -1;
    };
}

export default new NavigationService();
