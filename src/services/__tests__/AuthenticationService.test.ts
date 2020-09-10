import DeviceInfo from 'react-native-device-info';

import Preferences from '@common/libs/preferences';
import { Navigator } from '@common/helpers/navigator';

import AppService, { AppStateStatus } from '../AppService';
import NavigationService from '../NavigationService';
import AuthenticationService from '../AuthenticationService';

describe('AppService', () => {
    const authenticationService = AuthenticationService;
    const appService = AppService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(AppService, 'addListener');
        const spy2 = jest.spyOn(AppService, 'removeListener');

        // initialize the service
        await authenticationService.initialize();

        // fake the setRoot command
        NavigationService.emit('setRoot', 'OnboardingRoot');
        expect(spy2).toBeCalledWith('appStateChange', AuthenticationService.onAppStateChange);

        // fake the setRoot command
        NavigationService.emit('setRoot', 'DefaultStack');
        expect(spy1).toBeCalledWith('appStateChange', AuthenticationService.onAppStateChange);
    });

    it('should check for lock when coming from inactive/background state', async () => {
        const spy1 = jest.spyOn(authenticationService, 'checkLockScreen');

        AppService.prevAppState = AppStateStatus.Background;
        AppService.currentAppState = AppStateStatus.Active;
        AppService.emit('appStateChange', AppStateStatus.Active);
        expect(spy1).toBeCalled();

        const spy2 = jest.spyOn(authenticationService, 'checkLockScreen');

        AppService.prevAppState = AppStateStatus.Inactive;
        AppService.currentAppState = AppStateStatus.Active;
        AppService.emit('appStateChange', AppStateStatus.Active);
        expect(spy2).toBeCalled();
    });
});
