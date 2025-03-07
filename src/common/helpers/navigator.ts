import { get } from 'lodash';
import { Platform, InteractionManager } from 'react-native';

import { Navigation, Options, LayoutTabsChildren } from 'react-native-navigation';

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

const allScreens = new Set();

/* Constants ==================================================================== */
const getDefaultOptions = (): Options => {
    return {
        layout: {
            backgroundColor: StyleService.value('$background'),
            componentBackgroundColor: StyleService.value('$background'),
            orientation: ['portrait'],
            adjustResize: false,
        },
        topBar: {
            visible: false,
        },
        navigationBar: {
            backgroundColor: StyleService.value('$tint'),
        },
        statusBar: {
            // @ts-ignore
            style: Platform.select({
                android: undefined,
                // @ts-ignore
                ios: StyleService.value(StyleService.select({ light: 'dark', dark: 'light' })),
            }),
            drawBehind: false,
        },
        bottomTabs: {
            backgroundColor: StyleService.value('$background'),
            translucent: false,
            animate: false,
            drawBehind: false,
            tabsAttachMode: 'onSwitchToTab',
            titleDisplayMode: 'alwaysShow',
            elevation: 10,
            hideShadow: Platform.OS === 'android',
            // @ts-ignore
            shadow: Platform.select({
                android: undefined,
                ios: {
                    // @ts-ignore
                    opacity: StyleService.value(StyleService.select({ light: 0.07, dark: 0.13 })),
                    // @ts-ignore
                    color: StyleService.value(StyleService.select({ light: 'black', dark: 'white' })),
                    // @ts-ignore
                    radius: StyleService.value(StyleService.select({ light: 8, dark: 12 })),
                },
            }),
        },
        animations: {
            pop: {
                enabled: Platform.OS === 'ios',
            },
            setRoot: {
                waitForRender: true, // Wait for the component to render before ANY transitions
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
            scale: GetBottomTabScale(0.9),
        },
        [AppScreens.TabBar.Events]: {
            icon: StyleService.getImage('IconTabBarEvents'),
            iconSelected: StyleService.getImage('IconTabBarEventsSelected'),
            scale: GetBottomTabScale(0.9),
        },
        [AppScreens.TabBar.Actions]: {
            icon: StyleService.getImage('IconTabBarActions'),
            iconSelected: StyleService.getImage('IconTabBarActions'),
            scale: GetBottomTabScale(0.65),
        },
        [AppScreens.TabBar.XApps]: {
            icon: StyleService.getImage('IconTabBarXapp'),
            iconSelected: StyleService.getImage('IconTabBarXappSelected'),
            scale: GetBottomTabScale(0.9),
        },
        [AppScreens.TabBar.Settings]: {
            icon: StyleService.getImage('IconTabBarSettings'),
            iconSelected: StyleService.getImage('IconTabBarSettingsSelected'),
            scale: GetBottomTabScale(0.9),
        },
    };
};

const bottomTabsChildren: LayoutTabsChildren[] = [];

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
     * Navigates to a specific tab by name.
     *
     * @param {string} tabName - The name of the tab to navigate to (e.g., 'Home', 'Events', 'XApps', 'Settings').
     * @return {void}
     */
    navigateToTab(tabName: string): void {   
        const tabId = `bottomTab-${tabName}`;
    
        // Ensure the root is the bottom tab layout
        Navigation.setRoot({
            root: {
                bottomTabs: {
                    id: RootType.DefaultRoot,
                    children: bottomTabsChildren,
                },
            },
        });
    
        // Switch to the specified tab
        Navigation.mergeOptions(RootType.DefaultRoot, {
            bottomTabs: {
                currentTabId: tabId,
            },
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
        const currentScreen = NavigationService.getCurrentScreen() ?? '';
        if (currentScreen !== nextScreen) {
            allScreens.add(nextScreen);
            return Navigation.push(currentScreen, {
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
                        // Disable automatic splash screen dismissal
                        animations: {
                            setRoot: {
                              waitForRender: true, // Wait for the component to render before ANY transitions
                            },
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
        options: Options = {},
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
    updateProps<P extends object>(screen: AppScreenKeys, props: EnforcedProps<P>): void {
        const currentScreen = screen || NavigationService.getCurrentScreen();
        Navigation.updateProps(currentScreen, props);
    },

    isInstantThemeSwitchPage(screenId: string): string | false {
        return ([ 'app.Settings.General', ...Object.values(AppScreens.TabBar) ] as string[])
            .indexOf(screenId) > -1
                ? screenId
                : false;
    },

    awaitSafeThemeSwitch(): Promise<void> {
        return new Promise(resolve => {
            if (!Navigator.isInstantThemeSwitchPage(NavigationService.getCurrentScreen() || '')) {
                // console.log('Wait till back at main pages, now at', NavigationService.getCurrentScreen());
                const pageListener = Navigation
                    .events()
                    .registerComponentDidAppearListener(({ componentId }) => {
                        // console.log('componentId', componentId, 'appeared', Object.values(AppScreens.TabBar))
                        if (Navigator.isInstantThemeSwitchPage(componentId)) {
                            // console.log('Awaited page to one of main tab pages so going now')
                            pageListener.remove();
                            resolve();
                        }
                    });
    
                return;
            }
    
            const modalOpen = NavigationService.getCurrentModal();
            if (modalOpen) {
                // We wait with all the updates till it closes
                // console.log('Wait cause modal open', modalOpen)
                const modalDismissListener = Navigation
                    .events()
                    .registerModalDismissedListener(({ componentId }) => {
                        if (componentId === modalOpen) {
                            // console.log('Awaited modal close so going now', modalOpen)
                            modalDismissListener.remove();
                            resolve();
                        }
                    });
                return;
            }
    
            const overlayOpen = NavigationService.getCurrentOverlay();
            if (overlayOpen) {
                // We wait with all the updates till it closes
                // console.log('Wait cause overlay open', overlayOpen)
                const overlayDismissListener = Navigation
                    .events()
                    .registerComponentDidDisappearListener(({ componentId }) => {
                        if (componentId === overlayOpen) {
                            // console.log('Awaited overlay close so going now', overlayOpen)
                            overlayDismissListener.remove();
                            resolve();
                        }
                    });
                return;
            }
    
            resolve();
        });
    },

    switchTheme(): void {
        Navigator.awaitSafeThemeSwitch().then(() => {
            Navigator.reRender();
        });
    },

    /**
     * Updates the tabbar and re-renders the AppScreens.TabBar component.
     *
     * @return {void}
     */
    reRender(): void {
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

        // Update ALL active screens/stacks
        ;(allScreens as unknown as string[]).forEach(allScreenIterator => {
            Navigation.mergeOptions(allScreenIterator, { ...defaultOptions });
            Navigation.updateProps(allScreenIterator, { timestamp: +new Date() });
        });

        const TabBarIcons = getTabBarIcons();

        const updateTab = (tab: string) => {
            const tabId = `bottomTab-${tab}`;
            bottomTabsChildren
                .filter(b => b.stack?.id === tabId)?.[0].stack?.children?.forEach(child => {
                    if (child.component?.id) {
                        Navigation.mergeOptions(child.component.id, { ...defaultOptions });
                        Navigation.updateProps(child.component.id, { timestamp: +new Date() });
                    }
                });

            const currentBottomTab = bottomTabsChildren
                .filter(b => b.stack?.id === tabId)?.[0].stack?.options?.bottomTab;

            if (currentBottomTab) {
                const getTab = get(AppScreens.TabBar, tab);
                Navigation.mergeOptions(getTab, {
                    bottomTab: {
                        ...currentBottomTab,
                        text: tab !== 'Actions' ? Localize.t(`global.${tab.toLowerCase()}`) : '',
                        icon: {
                            scale: TabBarIcons[getTab].scale,
                            ...TabBarIcons[getTab].icon,
                        },
                        selectedIcon: {
                            scale: TabBarIcons[getTab].scale,
                            ...TabBarIcons[getTab].iconSelected,
                        },
                        ...bottomTabStyles,
                    },
                    // ...defaultOptions,
                });

                Navigation.updateProps(getTab, { timestamp: +new Date() });
            }
        };
    
        let navSections = (NavigationService.getCurrentScreen() || '').split('.');
        let isAtMainTab = false;

        if (navSections?.[0] === 'app' && navSections?.[1] === 'TabBar') {
            isAtMainTab = true;
        }

        if (NavigationService.getCurrentScreen() === 'app.Settings.General') {
            // Mock settings for return
            isAtMainTab = true;
            navSections = ['app', 'TabBar', 'Settings'];
        }

        // First the artive tab
        if (isAtMainTab && navSections?.[2]) {
            requestAnimationFrame(() => {
                updateTab(navSections?.[2]);
            });
        }

        // Then the rest
        requestAnimationFrame(() => {
            // Update the root with defaultOptions
            Navigation.mergeOptions(RootType.DefaultRoot, { ...defaultOptions });
            Navigation.updateProps(RootType.DefaultRoot, { timestamp: +new Date() });

            Object.keys(AppScreens.TabBar)
                .filter(tab => !isAtMainTab || (navSections?.[2] && tab !== navSections?.[2]) || !navSections?.[2])
                .forEach(tab => updateTab(tab));
        });

        requestAnimationFrame(() => {
            // Update any active modals
            const currentModal = NavigationService.getCurrentModal();
            if (currentModal) {
                // ^^ don't switch xapp browser as it borks webview state
                Navigation.mergeOptions(currentModal, { ...defaultOptions });
                Navigation.updateProps(currentModal, { timestamp: +new Date() });
            }
            const currentOverlay = NavigationService.getCurrentOverlay();
            if (currentOverlay) {
                // console.log(defaultOptions)
                // Navigation.mergeOptions(currentOverlay, { ...defaultOptions });
                // ^^ No need & if enabled it kills transparency on the backdrops
                Navigation.updateProps(currentOverlay, { timestamp: +new Date() });
            }
        });
    },
};

export { Navigator };
