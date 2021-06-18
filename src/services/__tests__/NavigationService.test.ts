import NavigationService from '../NavigationService';

jest.useFakeTimers();

describe('NavigationService', () => {
    const navigationService = NavigationService;
    const onboardingScreen = 'app.onboarding';
    const modalOverlay = 'overlay.something';

    it('should return current screen', () => {
        navigationService.currentScreen = onboardingScreen;
        expect(navigationService.getCurrentScreen()).toBe(onboardingScreen);
    });

    it('should set/get current overlay', () => {
        navigationService.setCurrentOverlay(modalOverlay);
        expect(navigationService.getCurrentOverlay()).toBe(modalOverlay);
    });
});
