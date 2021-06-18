import NavigationService from '../NavigationService';

jest.useFakeTimers();

describe('NavigationService', () => {
    const navigationService = NavigationService;
    const onboardingScreen = 'app.onboarding';
    const modalOverlay = 'overlay.something';
    const root = 'DefaultRoot';

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
