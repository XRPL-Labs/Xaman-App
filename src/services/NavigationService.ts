/**
 * Navigation service
 * Subscribe to navigation events
 */

import { last, take } from 'lodash';
import firebase from 'react-native-firebase';

import EventEmitter from 'events';

import {
    Navigation,
    ComponentDidAppearEvent,
    BottomTabLongPressedEvent,
    BottomTabPressedEvent,
    ModalDismissedEvent,
} from 'react-native-navigation';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

class NavigationService extends EventEmitter {
    prevScreen: string;
    currentRoot: string;
    currentScreen: string;
    overlays: Array<string>;
    enabled: boolean;

    constructor() {
        super();

        this.prevScreen = '';
        this.currentRoot = '';
        this.currentScreen = '';
        this.overlays = [];
        this.enabled = !__DEV__;
    }

    initialize = () => {
        return new Promise((resolve, reject) => {
            try {
                // enable firebase analytics collection
                firebase.analytics().setAnalyticsCollectionEnabled(true);
                // navigation event listeners
                Navigation.events().registerComponentDidAppearListener(this.componentDidAppear);
                Navigation.events().registerCommandListener(this.navigatorCommandListener);
                Navigation.events().registerModalDismissedListener(this.modalDismissedListener);
                Navigation.events().registerBottomTabLongPressedListener(
                    ({ selectedTabIndex }: BottomTabLongPressedEvent) => {
                        if (selectedTabIndex === 1) {
                            Navigator.showOverlay(AppScreens.Overlay.SwitchAccount, {
                                layout: {
                                    backgroundColor: 'transparent',
                                    componentBackgroundColor: 'transparent',
                                },
                            });
                        }
                    },
                );
                Navigation.events().registerBottomTabPressedListener(({ tabIndex }: BottomTabPressedEvent) => {
                    if (tabIndex === 2) {
                        Navigator.showModal(AppScreens.Modal.Scan, {
                            modalTransitionStyle: 'crossDissolve',
                            modalPresentationStyle: 'fullScreen',
                        });
                    }
                });

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

    getCurrentScreen = (): string => {
        return this.currentScreen;
    };

    setCurrentScreen = (currentScreen: string) => {
        if (this.currentScreen !== currentScreen) {
            // broadcast to firebase
            firebase.analytics().setCurrentScreen(currentScreen, currentScreen);

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
