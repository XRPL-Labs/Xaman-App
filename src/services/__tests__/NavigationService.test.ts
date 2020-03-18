import NavigationService from '../NavigationService';

describe('NavigationService', () => {
    const navigationService = NavigationService;
    const onboardingScreen = 'app.onboarding';
    const homeScreen = 'app.home';
    const modalOverlay = 'overlay.something';
    const root = 'DefaultRoot';

    it('should set current/prev screen and analytics', () => {
        navigationService.currentScreen = onboardingScreen;

        const spy = jest.spyOn(navigationService, 'setPrevScreen');

        navigationService.setCurrentScreen(homeScreen);

        expect(spy).toBeCalledWith(onboardingScreen);
        expect(navigationService.currentScreen).toBe(homeScreen);
        expect(navigationService.getPrevScreen()).toBe(onboardingScreen);
    });

    it('should return current screen', () => {
        navigationService.currentScreen = onboardingScreen;
        expect(navigationService.getCurrentScreen()).toBe(onboardingScreen);
    });

    it('should set/get current overlay', () => {
        navigationService.setCurrentOverlay(modalOverlay);
        expect(navigationService.getCurrentOverlay()).toBe(modalOverlay);
    });

    it('should set/get current root', () => {
        navigationService.setCurrentRoot(root);
        expect(navigationService.getCurrentRoot()).toBe(root);
    });
});
