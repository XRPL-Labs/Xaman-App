import { get } from 'lodash';
import { Platform, InteractionManager } from 'react-native';
import { Navigation, Options } from 'react-native-navigation';

import { GetBottomTabScale, HasBottomNotch } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import NavigationService, { ComponentTypes, RootType } from '@services/NavigationService';
import StyleService from '@services/StyleService';

import { Props as AlertOverlayProps } from '@screens/Overlay/Alert/types';

import AppFonts from '@theme/fonts';
/* Types ==================================================================== */
export type AppScreenKeys<T = typeof AppScreens, L0 = T[keyof T]> =
    L0 extends Record<string, any> ? AppScreenKeys<L0> : L0;

type EnforcedProps<P extends { [K in keyof P]: any }> = P;

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

const getTabBarIcons = (): {
    [k in string]: {
        icon: { uri: string };
        iconSelected: { uri: string };
        scale: number;
    };
} => {
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
    /**
     * Initializes and sets the default configuration for the navigation tabs.
     * This method starts the app in bottom tabs mode
     *
     * @return {void}
     */
    startDefault(): void {
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

    /**
     * Starts the app navigation in onboarding screen
     *
     * @return {void}
     */
    startOnboarding(): void {
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

    /**
     * Pushes a new screen to the navigation stack.
     *
     * @template P - Props type
     * @param nextScreen - The key of the screen to push.
     * @param passProps - The props to pass to the pushed screen.
     * @param options - The options for the pushed screen (default: {}).
     * @returns Screen name if the screen was pushed, otherwise false.
     */
    push<P extends object>(
        nextScreen: AppScreenKeys,
        passProps: EnforcedProps<P>,
        options: Options = {},
    ): Promise<string | boolean> {
        const currentScreen = NavigationService.getCurrentScreen();
        if (currentScreen !== nextScreen) {
            return Navigation.push(nextScreen, {
                component: {
                    name: nextScreen,
                    id: nextScreen,
                    passProps: Object.assign(passProps, { componentType: ComponentTypes.Screen }),
                    options,
                },
            });
        }

        return Promise.resolve(false);
    },

    /**
     * Pops the current screen from the navigation stack.
     *
     * @param {Options} options - Optional configuration options for the pop operation.
     * @return {Promise} - A promise that resolves when the pop operation is complete.
     */
    pop(options: Options = {}): Promise<string | boolean> {
        const currentScreen = NavigationService.getCurrentScreen();

        if (currentScreen) {
            return Navigation.pop(currentScreen, options);
        }

        return Promise.resolve(false);
    },

    /**
     * Pops to the root screen of the navigation stack.
     *
     * @param {Options} [options={}] - The options for popping to the root screen. (optional)
     * @return {Promise<string | boolean>} - A promise that resolves with no value.
     */
    popToRoot(options: Options = {}): Promise<string | boolean> {
        const currentScreen = NavigationService.getCurrentScreen();

        if (currentScreen) {
            return Navigation.popToRoot(currentScreen, options);
        }

        return Promise.resolve(false);
    },

    /**
     * Displays the specified overlay screen.
     *
     * @template P - Type for the passProps argument
     * @param {AppScreenKeys} overlay - The name of the overlay screen to display.
     * @param {EnforcedProps<P>} passProps - The properties to pass to the overlay screen.
     * @param {Options} [options={}] - Additional options for customizing the overlay's appearance and behavior.
     * @returns {Promise<string | boolean>} - A Promise that resolves to either the overlay's id or false
     */
    showOverlay<P extends object>(
        overlay: AppScreenKeys,
        passProps: EnforcedProps<P>,
        options: Options = {},
    ): Promise<string | boolean> {
        const currentOverlay = NavigationService.getCurrentOverlay();

        if (currentOverlay !== overlay) {
            return Navigation.showOverlay({
                component: {
                    name: overlay,
                    id: overlay,
                    passProps: Object.assign(passProps, { componentType: ComponentTypes.Overlay }),
                    options: {
                        overlay: {
                            handleKeyboardEvents: true,
                        },
                        layout: {
                            backgroundColor: 'transparent',
                            componentBackgroundColor: 'transparent',
                        },
                        ...options,
                    },
                },
            });
        }

        return Promise.resolve(false);
    },

    /**
     * Dismisses the specified overlay or current overlay.
     *
     * @param {AppScreenKeys} [overlay] - The overlay to dismiss. If not provided, the current overlay will be used.
     * @return {Promise<string | boolean>} - A promise that resolves to a string or boolean value.
     */
    dismissOverlay(overlay?: AppScreenKeys): Promise<string | boolean> {
        const overlayToDismiss = overlay ?? NavigationService.getCurrentOverlay();

        if (overlayToDismiss) {
            return Navigation.dismissOverlay(overlayToDismiss);
        }

        return Promise.resolve(false);
    },

    /**
     * Display a modal screen using React Navigation.
     *
     * @template P - Type parameter representing the props object for the modal screen.
     * @param {string} modal - The key name of the modal screen component to be displayed.
     * @param {P} passProps - The props object to be passed to the modal screen component.
     * @param {object} [options={}] - Additional options for the modal screen component.
     * @returns {boolean} - Returns `string` if the modal screen is shown successfully, otherwise `false`.
     */
    showModal<P extends object>(
        modal: AppScreenKeys,
        passProps: EnforcedProps<P>,
        options = {},
    ): Promise<string | boolean> {
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
                                passProps: Object.assign(passProps, { componentType: ComponentTypes.Modal }),
                            },
                        },
                    ],
                },
            });
        }

        return Promise.resolve(false);
    },

    /**
     * Dismisses the current modal.
     *
     * @return {Promise<string | boolean>} A promise that resolves to either string or false
     */
    dismissModal(): Promise<string | boolean> {
        const currentModal = NavigationService.getCurrentModal();

        if (currentModal) {
            return Navigation.dismissModal(currentModal);
        }

        return Promise.resolve(false);
    },

    /**
     * Sets a badge to a specified tab.
     *
     * @param {string} tab - The tab to set the badge on.
     * @param {string} badge - The badge value to set.
     * @return {void}
     */
    setBadge(tab: string, badge: string): void {
        Navigation.mergeOptions(tab, {
            bottomTab: {
                badge,
            },
        });
    },

    /**
     * Displays a modal overlay with an alert message and passed props.
     *
     * @param {AlertOverlayProps} props - The props for the alert overlay.
     * @return {Promsie<string | boolean>}
     */
    showAlertModal(props: AlertOverlayProps): Promise<string | boolean> {
        return Navigator.showOverlay<AlertOverlayProps>(AppScreens.Overlay.Alert, props);
    },

    /**
     * Merges the provided options object with the options of the current screen.
     * If screen is not provided, the current screen is determined using NavigationService.
     *
     * @param {AppScreenKeys} screen - The screen for which to merge the options. defaults to the current screen.
     * @param {Options} options - The options to merge with the current screen's options.
     *
     * @return {void}
     */
    mergeOptions(screen: AppScreenKeys, options: Options = {}): void {
        const currentScreen = screen || NavigationService.getCurrentScreen();
        Navigation.mergeOptions(currentScreen, options);
    },

    /**
     * Updates the props of a specific screen in the app.
     *
     * @template P - The type of the props being updated.
     * @param {AppScreenKeys} screen - The key of the screen to update the props for or current screen
     * @param {EnforcedProps<P>} props - The new props to apply to the screen.
     * @return {void}
     */
    updateProps<P>(screen: AppScreenKeys, props: EnforcedProps<P>): void {
        const currentScreen = screen || NavigationService.getCurrentScreen();
        Navigation.updateProps(currentScreen, props as any);
    },

    /**
     * Updates the tabbar and re-renders the AppScreens.TabBar component.
     *
     * @return {void}
     */
    reRender(): void {
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
