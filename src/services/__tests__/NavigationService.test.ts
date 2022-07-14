import { NativeModules } from 'react-native';
import { Navigation } from 'react-native-navigation';

import AppScreens from '@common/constants/screens';

import NavigationService, { RootType, ComponentTypes } from '../NavigationService';

jest.useFakeTimers();

describe('NavigationService', () => {
    const navigationService = NavigationService;

    afterEach(() => {
        // clear service history
        navigationService.currentRoot = '';
        navigationService.currentScreen = '';
        navigationService.modals = [];
        navigationService.overlays = [];
    });

    it('should return correct component type', () => {
        expect(navigationService.getComponentType('')).toBe(ComponentTypes.Unknown);
        expect(navigationService.getComponentType(AppScreens.TabBar.Home)).toBe(ComponentTypes.TabBar);
        expect(navigationService.getComponentType(AppScreens.Settings.General)).toBe(ComponentTypes.Screen);
        expect(navigationService.getComponentType(AppScreens.Modal.Scan)).toBe(ComponentTypes.Modal);
        expect(navigationService.getComponentType(AppScreens.Overlay.SwitchAccount)).toBe(ComponentTypes.Overlay);
    });

    it('should return correct values for checking root components', () => {
        expect(navigationService.isRootComponent(AppScreens.Onboarding)).toBe(true);
        expect(navigationService.isRootComponent(AppScreens.TabBar.Home)).toBe(true);
        expect(navigationService.isRootComponent(AppScreens.TabBar.Events)).toBe(true);
        expect(navigationService.isRootComponent(AppScreens.TabBar.Pro)).toBe(true);
        expect(navigationService.isRootComponent(AppScreens.TabBar.Settings)).toBe(true);
        expect(navigationService.isRootComponent(AppScreens.Settings.General)).toBe(false);
    });

    it('should return current screen', () => {
        navigationService.setCurrentScreen(AppScreens.TabBar.Home);
        expect(navigationService.getCurrentScreen()).toBe(AppScreens.TabBar.Home);
    });

    it('should set/get current overlay', () => {
        navigationService.setCurrentOverlay(AppScreens.Overlay.Alert);
        expect(navigationService.overlays).toEqual([AppScreens.Overlay.Alert]);
        expect(navigationService.getCurrentOverlay()).toBe(AppScreens.Overlay.Alert);
    });

    it('should set/get current modal', () => {
        navigationService.setCurrentModal(AppScreens.Modal.Scan);
        expect(navigationService.modals).toEqual([AppScreens.Modal.Scan]);
        expect(navigationService.getCurrentModal()).toBe(AppScreens.Modal.Scan);
    });

    it('should set/get current root', () => {
        navigationService.onRootChange(RootType.DefaultRoot);
        expect(navigationService.getCurrentRoot()).toBe(RootType.DefaultRoot);
    });

    it('should show account switch overlay when longPress tabbar', () => {
        const showOverlaySpy = jest.spyOn(Navigation, 'showOverlay');

        navigationService.bottomTabLongPressedListener({ selectedTabIndex: 0 });

        expect(showOverlaySpy).toBeCalledWith({
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
    });

    it('should show home actions overlay when scan button pressed in tabbar', () => {
        const showOverlaySpy = jest.spyOn(Navigation, 'showOverlay');

        navigationService.bottomTabPressedListener({ tabIndex: 2 });

        expect(showOverlaySpy).toBeCalledWith({
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
    });

    it('should set current overlay when shown', () => {
        navigationService.componentDidAppear({
            componentId: AppScreens.Overlay.SwitchAccount,
            componentName: AppScreens.Overlay.SwitchAccount,
            passProps: { componentType: ComponentTypes.Overlay },
            componentType: 'Component',
        });

        expect(navigationService.getCurrentOverlay()).toBe(AppScreens.Overlay.SwitchAccount);

        navigationService.componentDidAppear({
            componentId: AppScreens.Overlay.Lock,
            componentName: AppScreens.Overlay.Lock,
            passProps: { componentType: ComponentTypes.Overlay },
            componentType: 'Component',
        });

        expect(navigationService.getCurrentOverlay()).toBe(AppScreens.Overlay.Lock);

        expect(navigationService.overlays).toEqual([AppScreens.Overlay.SwitchAccount, AppScreens.Overlay.Lock]);
    });

    it('should set current root when set', () => {
        navigationService.navigatorCommandListener('setRoot', { layout: { root: { id: RootType.DefaultRoot } } });
        expect(navigationService.getCurrentRoot()).toBe(RootType.DefaultRoot);
    });

    it('should set current modal when shown', () => {
        expect(navigationService.modals).toEqual([]);

        navigationService.componentDidAppear({
            componentId: AppScreens.Modal.XAppBrowser,
            componentName: AppScreens.Modal.XAppBrowser,
            passProps: { componentType: ComponentTypes.Modal },
            componentType: 'Component',
        });

        expect(navigationService.modals).toEqual([AppScreens.Modal.XAppBrowser]);
        expect(navigationService.getCurrentModal()).toBe(AppScreens.Modal.XAppBrowser);

        navigationService.componentDidAppear({
            componentId: AppScreens.Modal.DestinationPicker,
            componentName: AppScreens.Modal.DestinationPicker,
            passProps: { componentType: ComponentTypes.Modal },
            componentType: 'Component',
        });

        expect(navigationService.modals).toEqual([AppScreens.Modal.XAppBrowser, AppScreens.Modal.DestinationPicker]);
        expect(navigationService.getCurrentModal()).toBe(AppScreens.Modal.DestinationPicker);
    });

    it('should remove modal from history list when dismissed', () => {
        navigationService.setCurrentModal(AppScreens.Modal.XAppBrowser);
        navigationService.setCurrentModal(AppScreens.Modal.DestinationPicker);

        expect(navigationService.getCurrentModal()).toBe(AppScreens.Modal.DestinationPicker);

        navigationService.modalDismissedListener({
            componentId: AppScreens.Modal.DestinationPicker,
            componentName: '',
            modalsDismissed: undefined,
        });

        expect(navigationService.getCurrentModal()).toBe(AppScreens.Modal.XAppBrowser);
    });

    it('should remove overlay from history list when dismissed', () => {
        navigationService.setCurrentOverlay(AppScreens.Overlay.Lock);
        navigationService.setCurrentOverlay(AppScreens.Overlay.RecipientMenu);

        expect(navigationService.getCurrentOverlay()).toBe(AppScreens.Overlay.RecipientMenu);

        navigationService.navigatorCommandListener('dismissOverlay', { componentId: AppScreens.Overlay.RecipientMenu });

        expect(navigationService.getCurrentOverlay()).toBe(AppScreens.Overlay.Lock);
    });

    it('should set current screen base on componentType in passProps', () => {
        navigationService.componentDidAppear({
            componentId: AppScreens.Settings.General,
            componentName: AppScreens.Settings.General,
            passProps: { componentType: ComponentTypes.Screen },
            componentType: 'Component',
        });

        expect(navigationService.getCurrentScreen()).toBe(AppScreens.Settings.General);

        navigationService.componentDidAppear({
            componentId: AppScreens.Transaction.Details,
            componentName: AppScreens.Transaction.Details,
            passProps: { componentType: ComponentTypes.Modal },
            componentType: 'Component',
        });

        expect(navigationService.getCurrentModal()).toBe(AppScreens.Transaction.Details);

        navigationService.componentDidAppear({
            componentId: AppScreens.TabBar.Home,
            componentName: AppScreens.TabBar.Home,
            passProps: {},
            componentType: 'Component',
        });

        expect(navigationService.getCurrentScreen()).toBe(AppScreens.TabBar.Home);
    });

    it('should handle hardware back press on android', () => {
        navigationService.setCurrentOverlay(AppScreens.Overlay.Lock);

        // should not close the overlay if it's lock overlay
        const dismissOverlaySpy = jest.spyOn(Navigation, 'dismissOverlay');
        expect(navigationService.handleAndroidBackButton()).toBe(true);
        expect(dismissOverlaySpy).toBeCalledTimes(0);

        // should close the overlay
        navigationService.overlays = [];
        navigationService.setCurrentOverlay(AppScreens.Overlay.SwitchAccount);
        expect(navigationService.handleAndroidBackButton()).toBe(true);
        expect(dismissOverlaySpy).toBeCalledTimes(1);

        // should let os handle the close modal if any modal present
        navigationService.overlays = [];
        navigationService.setCurrentModal(AppScreens.Modal.Help);
        expect(navigationService.handleAndroidBackButton()).toBe(false);

        // should let os handle the pop screen if not modal present and not in root screen
        navigationService.modals = [];
        navigationService.setCurrentScreen(AppScreens.Account.Add);
        expect(navigationService.handleAndroidBackButton()).toBe(false);

        // should exit the app if no modal or overlay and in root
        const { AppUtilsModule } = NativeModules;
        const exitSpy = jest.spyOn(AppUtilsModule, 'exitApp');

        navigationService.overlays = [];
        navigationService.modals = [];
        navigationService.setCurrentScreen(AppScreens.TabBar.Home);
        expect(navigationService.handleAndroidBackButton()).toBe(true);
        expect(navigationService.backHandlerClickCount).toBe(1);
        expect(navigationService.handleAndroidBackButton()).toBe(false);
        expect(exitSpy).toBeCalled();
    });
});
