import { get, merge } from 'lodash';
import { Platform } from 'react-native';
import { Navigation } from 'react-native-navigation';

import { Images, getBottomTabScale, isIOS10 } from '@common/helpers';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { NavigationService } from '@services';

import { AppColors, AppFonts } from '@theme';

/* Constants ==================================================================== */
const defaultOptions = {
    layout: {
        backgroundColor: AppColors.white,
        componentBackgroundColor: AppColors.white,
        orientation: ['portrait'] as any,
    },
    topBar: {
        visible: false,
    },
    statusBar: {
        drawBehind: false,
    },
    bottomTabs: {
        backgroundColor: AppColors.white,
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
};

const bottomTabStyles = {
    // iconColor: AppColors.greyDark,
    // selectedIconColor: AppColors.black,
    textColor: AppColors.greyDark,
    selectedTextColor: AppColors.black,
    fontFamily: AppFonts.base.familyExtraBold,
};

const TabBarIcons = {
    [AppScreens.TabBar.Home]: {
        icon: Images.IconTabBarHome,
        iconSelected: Images.IconTabBarHomeSelected,
        scale: getBottomTabScale(),
    },
    [AppScreens.TabBar.Events]: {
        icon: Images.IconTabBarEvents,
        iconSelected: Images.IconTabBarEventsSelected,
        scale: getBottomTabScale(),
    },
    [AppScreens.TabBar.Scan]: {
        icon: Images.IconTabBarScan,
        iconSelected: Images.IconTabBarScan,
        offset: { top: isIOS10() && 6, right: 0, bottom: isIOS10() && -6, left: 0 },
        scale: getBottomTabScale(0.7),
    },
    [AppScreens.TabBar.Profile]: {
        icon: Images.IconTabBarProfile,
        iconSelected: Images.IconTabBarProfileSelected,
        scale: getBottomTabScale(),
    },
    [AppScreens.TabBar.Settings]: {
        icon: Images.IconTabBarSettings,
        iconSelected: Images.IconTabBarSettingsSelected,
        scale: getBottomTabScale(),
    },
};

/* Lib ==================================================================== */

const Navigator = {
    startDefault() {
        Navigation.setDefaultOptions(defaultOptions);

        const bottomTabsChildren: any = [];

        Object.keys(AppScreens.TabBar).forEach(tab => {
            bottomTabsChildren.push({
                stack: {
                    id: get(AppScreens.TabBar, tab),
                    children: [
                        {
                            component: {
                                name: tab === 'Scan' ? AppScreens.Placeholder : get(AppScreens.TabBar, tab),
                            },
                        },
                    ],
                    options: {
                        bottomTab: {
                            selectTabOnPress: tab !== 'Scan',
                            iconInsets: { ...TabBarIcons[get(AppScreens.TabBar, tab)].offset },
                            text: Platform.select({
                                android: Localize.t(`global.${tab.toLowerCase()}`),
                                ios: tab !== 'Scan' ? Localize.t(`global.${tab.toLowerCase()}`) : '',
                            }),
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

        Navigation.setRoot({
            root: {
                bottomTabs: {
                    id: 'DefaultStack',
                    children: bottomTabsChildren,
                },
            },
        });
    },

    startOnboarding() {
        Navigation.setDefaultOptions(defaultOptions);

        return Navigation.setRoot({
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
    },

    startConnectionIssue() {
        Navigation.setDefaultOptions(defaultOptions);

        return Navigation.setRoot({
            root: {
                stack: {
                    id: AppScreens.ConnectionIssue,
                    children: [
                        {
                            component: {
                                name: AppScreens.ConnectionIssue,
                            },
                        },
                    ],
                },
            },
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
                    options: merge({}, defaultOptions, options),
                },
            });
        }

        return false;
    },

    pop(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        return Navigation.pop(currentScreen, merge({}, defaultOptions, options));
    },

    popToRoot(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        return Navigation.popToRoot(currentScreen, merge({}, defaultOptions, options));
    },

    showOverlay(overlay: any, options = {}, passProps = {}) {
        const currentOverlay = NavigationService.getCurrentOverlay();
        if (currentOverlay !== overlay) {
            return Navigation.showOverlay({
                component: {
                    name: overlay,
                    id: overlay,
                    passProps,
                    options: merge({}, defaultOptions, options),
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
                                options: merge({}, defaultOptions, options),
                                passProps,
                            },
                        },
                    ],
                },
            });
        }

        return false;
    },

    dismissModal() {
        const currentScreen = NavigationService.getCurrentScreen();
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

    mergeOptions(options = {}) {
        const currentScreen = NavigationService.getCurrentScreen();
        Navigation.mergeOptions(currentScreen, options);
    },
};

export { Navigator };
