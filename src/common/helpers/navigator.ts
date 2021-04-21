import { get } from 'lodash';
import { Platform, InteractionManager } from 'react-native';
import { Navigation } from 'react-native-navigation';

import { GetBottomTabScale, IsIOS12 } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import NavigationService from '@services/NavigationService';
import StyleService from '@services/StyleService';

import AppFonts from '@theme/fonts';
/* Constants ==================================================================== */
const getDefaultOptions = () => {
    return StyleService.create({
        layout: {
            backgroundColor: '$background',
            componentBackgroundColor: '$background',
            orientation: ['portrait'] as any,
        },
        topBar: {
            visible: false,
        },
        statusBar: {
            style: Platform.select({
                android: 'default',
                ios: StyleService.isDarkMode() ? 'light' : 'dark',
            }),
            drawBehind: false,
        },
        bottomTabs: {
            backgroundColor: '$background',
            translucent: false,
            hideShadow: true,
            animate: true,
            drawBehind: true,
            tabsAttachMode: 'onSwitchToTab' as any,
            titleDisplayMode: 'alwaysShow' as any,
        },
        animations: {
            pop: {
                enabled: Platform.OS === 'ios',
            },
        },
        popGesture: true,
        blurOnUnmount: true,
    });
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
            offset: { top: IsIOS12() && 6, right: 0, bottom: IsIOS12() && -6, left: 0 },
            scale: GetBottomTabScale(0.65),
        },
        [AppScreens.TabBar.Profile]: {
            icon: StyleService.getImage('IconTabBarProfile'),
            iconSelected: StyleService.getImage('IconTabBarProfileSelected'),
            scale: GetBottomTabScale(),
        },
        [AppScreens.TabBar.Settings]: {
            icon: StyleService.getImage('IconTabBarSettings'),
            iconSelected: StyleService.getImage('IconTabBarSettingsSelected'),
            scale: GetBottomTabScale(),
        },
    };
};

/* Lib ==================================================================== */

const Navigator = {
    startDefault() {
        const defaultOptions = getDefaultOptions();
        Navigation.setDefaultOptions(defaultOptions);

        const bottomTabStyles = StyleService.applyTheme({
            // iconColor: '$greyDark',
            // selectedIconColor: '$black',
            textColor: '$grey',
            selectedTextColor: '$textPrimary',
            fontFamily: AppFonts.base.familyExtraBold,
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
                                name: tab === 'Actions' ? AppScreens.Placeholder : get(AppScreens.TabBar, tab),
                                id: get(AppScreens.TabBar, tab),
                            },
                        },
                    ],
                    options: {
                        bottomTab: {
                            selectTabOnPress: tab !== 'Actions',
                            iconInsets: { ...TabBarIcons[get(AppScreens.TabBar, tab)].offset },
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
                        id: 'DefaultStack',
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

    push(nextScreen: any, options = {}, passProps = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        if (currentScreen !== nextScreen) {
            return Navigation.push(currentScreen, {
                component: {
                    name: nextScreen,
                    id: nextScreen,
                    passProps,
                    options,
                },
            });
        }

        return false;
    },

    pop(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        return Navigation.pop(currentScreen, options);
    },

    popToRoot(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        return Navigation.popToRoot(currentScreen, options);
    },

    showOverlay(overlay: any, options = {}, passProps = {}) {
        const currentOverlay = NavigationService.getCurrentOverlay();
        if (currentOverlay !== overlay) {
            return Navigation.showOverlay({
                component: {
                    name: overlay,
                    id: overlay,
                    passProps,
                    options,
                },
            });
        }
        return false;
    },

    dismissOverlay() {
        const currentOverlay = NavigationService.pullCurrentOverlay();
        return Navigation.dismissOverlay(currentOverlay);
    },

    showModal(modal: any, options = {}, passProps = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        if (currentScreen !== modal) {
            return Navigation.showModal({
                stack: {
                    children: [
                        {
                            component: {
                                name: modal,
                                id: modal,
                                options,
                                passProps,
                            },
                        },
                    ],
                },
            });
        }

        return false;
    },

    dismissModal(componentId?: string) {
        const currentScreen = componentId || NavigationService.getCurrentScreen();
        return Navigation.dismissModal(currentScreen);
    },

    setBadge(tab: string, badge: string) {
        Navigation.mergeOptions(tab, {
            bottomTab: {
                badge,
            },
        });
    },

    changeSelectedTabIndex(index: number) {
        Navigation.mergeOptions('DefaultStack', {
            bottomTabs: {
                currentTabIndex: index,
            },
        });
    },

    showAlertModal(options: {
        type: 'success' | 'info' | 'warning' | 'error';
        text: string;
        title?: string;
        buttons: { text: string; onPress: () => void; type?: 'continue' | 'dismiss'; light?: boolean }[];
        onDismissed?: () => void;
    }) {
        Navigator.showOverlay(
            AppScreens.Overlay.Alert,
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
        );
    },

    mergeOptions(options = {}, componentId?: string) {
        const currentScreen = componentId || NavigationService.getCurrentScreen();
        Navigation.mergeOptions(currentScreen, options);
    },

    updateProps(props = {}, componentId?: string) {
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
