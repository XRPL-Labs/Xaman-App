import { get, assign } from 'lodash';
import { Platform, InteractionManager } from 'react-native';
import { Navigation, Options } from 'react-native-navigation';

import { GetBottomTabScale, HasBottomNotch } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import NavigationService, { ComponentTypes, RootType } from '@services/NavigationService';
import StyleService from '@services/StyleService';

import AppFonts from '@theme/fonts';
/* Constants ==================================================================== */
const getDefaultOptions = (): Options => {
    return {
        layout: {
            backgroundColor: StyleService.value('$background'),
            componentBackgroundColor: StyleService.value('$background'),
            orientation: ['portrait'] as any,
            adjustResize: false,
        },
        topBar: {
            visible: false,
        },
        navigationBar: {
            backgroundColor: StyleService.value('$tint'),
        },
        statusBar: {
            style: Platform.select({
                android: undefined,
                ios: StyleService.isDarkMode() ? 'light' : 'dark',
            }),
            drawBehind: false,
        },
        bottomTabs: {
            backgroundColor: StyleService.value('$background'),
            translucent: false,
            animate: false,
            drawBehind: false,
            tabsAttachMode: 'onSwitchToTab' as any,
            titleDisplayMode: 'alwaysShow' as any,
            elevation: 10,
            hideShadow: Platform.OS === 'android',
            shadow: Platform.select({
                android: undefined,
                ios: {
                    opacity: StyleService.isDarkMode() ? 0.13 : 0.07,
                    color: StyleService.isDarkMode() ? 'white' : 'black',
                    radius: StyleService.isDarkMode() ? 12 : 8,
                },
            }),
        },
        animations: {
            pop: {
                enabled: Platform.OS === 'ios',
            },
        },
        popGesture: true,
        blurOnUnmount: true,
    };
};

const getTabBarIcons = () => {
    return {
        [AppScreens.TabBar.Home]: {
            icon: StyleService.getImage('IconTabBarHome'),
            iconSelected: StyleService.getImage('IconTabBarHomeSelected'),
            scale: GetBottomTabScale(),
        },
        [AppScreens.TabBar.Events]: {
            icon: StyleService.getImage('IconTabBarEvents'),
            iconSelected: StyleService.getImage('IconTabBarEventsSelected'),
            scale: GetBottomTabScale(),
        },
        [AppScreens.TabBar.Actions]: {
            icon: StyleService.getImage('IconTabBarActions'),
            iconSelected: StyleService.getImage('IconTabBarActions'),
            scale: GetBottomTabScale(0.65),
        },
        [AppScreens.TabBar.XApps]: {
            icon: StyleService.getImage('IconTabBarXapp'),
            iconSelected: StyleService.getImage('IconTabBarXappSelected'),
            scale: GetBottomTabScale(),
        },
        [AppScreens.TabBar.Settings]: {
            icon: StyleService.getImage('IconTabBarSettings'),
            iconSelected: StyleService.getImage('IconTabBarSettingsSelected'),
            scale: GetBottomTabScale(0.9),
        },
    };
};

/* Lib ==================================================================== */

const Navigator = {
    startDefault() {
        const defaultOptions = getDefaultOptions();
        Navigation.setDefaultOptions(defaultOptions);

        const bottomTabStyles = StyleService.applyTheme({
            textColor: '$grey',
            selectedTextColor: '$textPrimary',
            fontFamily: AppFonts.base.familyExtraBold,
            iconInsets: {
                top: HasBottomNotch() ? 4 : 1,
            },
        });

        const TabBarIcons = getTabBarIcons();

        const bottomTabsChildren: any = [];

        Object.keys(AppScreens.TabBar).forEach((tab) => {
            bottomTabsChildren.push({
                stack: {
                    id: `bottomTab-${tab}`,
                    children: [
                        {
                            component: {
                                name: tab === 'Actions' ? AppScreens.Global.Placeholder : get(AppScreens.TabBar, tab),
                                id: get(AppScreens.TabBar, tab),
                            },
                        },
                    ],
                    options: {
                        topBar: {
                            visible: false,
                        },
                        bottomTab: {
                            selectTabOnPress: tab !== 'Actions',
                            text: tab !== 'Actions' ? Localize.t(`global.${tab.toLowerCase()}`) : '',
                            icon: {
                                scale: TabBarIcons[get(AppScreens.TabBar, tab)].scale,
                                ...TabBarIcons[get(AppScreens.TabBar, tab)].icon,
                            },
                            selectedIcon: {
                                scale: TabBarIcons[get(AppScreens.TabBar, tab)].scale,
                                ...TabBarIcons[get(AppScreens.TabBar, tab)].iconSelected,
                            },
                            testID: `tab-${tab}`,
                            ...bottomTabStyles,
                        },
                    },
                },
            });
        });

        InteractionManager.runAfterInteractions(() => {
            Navigation.setRoot({
                root: {
                    bottomTabs: {
                        id: RootType.DefaultRoot,
                        children: bottomTabsChildren,
                    },
                },
            });
        });
    },

    startOnboarding() {
        const defaultOptions = getDefaultOptions();
        Navigation.setDefaultOptions(defaultOptions);

        InteractionManager.runAfterInteractions(() => {
            Navigation.setRoot({
                root: {
                    stack: {
                        id: AppScreens.Onboarding,
                        children: [
                            {
                                component: {
                                    name: AppScreens.Onboarding,
                                },
                            },
                        ],
                    },
                },
            });
        });
    },

    push(nextScreen: any, passProps = {}, options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        if (currentScreen !== nextScreen) {
            return Navigation.push(currentScreen, {
                component: {
                    name: nextScreen,
                    id: nextScreen,
                    passProps: assign(passProps, { componentType: ComponentTypes.Screen }),
                    options,
                },
            });
        }

        return false;
    },

    pop(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();

        if (currentScreen) {
            return Navigation.pop(currentScreen, options);
        }

        return Promise.resolve();
    },

    popToRoot(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();

        if (currentScreen) {
            return Navigation.popToRoot(currentScreen, options);
        }

        return Promise.resolve();
    },

    showOverlay(overlay: any, passProps = {}, options = {}) {
        const currentOverlay = NavigationService.getCurrentOverlay();
        if (currentOverlay !== overlay) {
            return Navigation.showOverlay({
                component: {
                    name: overlay,
                    id: overlay,
                    passProps: assign(passProps, { componentType: ComponentTypes.Overlay }),
                    options: assign(
                        {
                            overlay: {
                                handleKeyboardEvents: true,
                            },
                            layout: {
                                backgroundColor: 'transparent',
                                componentBackgroundColor: 'transparent',
                            },
                        },
                        options,
                    ),
                },
            });
        }
        return false;
    },

    dismissOverlay(overlay?: string) {
        const overlayToDismiss = overlay ?? NavigationService.getCurrentOverlay();

        if (overlayToDismiss) {
            return Navigation.dismissOverlay(overlayToDismiss);
        }

        return Promise.resolve();
    },

    showModal(modal: any, passProps = {}, options = {}) {
        const currentScreen = NavigationService.getCurrentModal();
        if (currentScreen !== modal) {
            return Navigation.showModal({
                stack: {
                    id: modal,
                    children: [
                        {
                            component: {
                                name: modal,
                                id: modal,
                                options,
                                passProps: assign(passProps, { componentType: ComponentTypes.Modal }),
                            },
                        },
                    ],
                },
            });
        }

        return false;
    },

    dismissModal() {
        const currentModal = NavigationService.getCurrentModal();

        if (currentModal) {
            return Navigation.dismissModal(currentModal);
        }

        return Promise.resolve();
    },

    setBadge(tab: string, badge: string) {
        Navigation.mergeOptions(tab, {
            bottomTab: {
                badge,
            },
        });
    },

    showAlertModal(props: {
        testID?: string;
        type: 'success' | 'info' | 'warning' | 'error';
        text: string;
        title?: string;
        buttons: {
            testID?: string;
            text: string;
            onPress?: () => void;
            type?: 'continue' | 'dismiss';
            light?: boolean;
        }[];
        onDismissed?: () => void;
    }) {
        Navigator.showOverlay(AppScreens.Overlay.Alert, props);
    },

    mergeOptions(componentId?: string, options = {}) {
        const currentScreen = componentId || NavigationService.getCurrentScreen();
        Navigation.mergeOptions(currentScreen, options);
    },

    updateProps(componentId?: string, props = {}) {
        const currentScreen = componentId || NavigationService.getCurrentScreen();
        Navigation.updateProps(currentScreen, props);
    },

    reRender() {
        // update the tabbar
        Object.keys(AppScreens.TabBar).forEach((tab) => {
            Navigation.mergeOptions(`bottomTab-${tab}`, {
                bottomTab: {
                    text: tab !== 'Actions' ? Localize.t(`global.${tab.toLowerCase()}`) : '',
                },
            });

            Navigation.updateProps(get(AppScreens.TabBar, tab), { timestamp: +new Date() });
        });
    },
};

export { Navigator };
