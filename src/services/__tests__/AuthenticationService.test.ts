import AppService, { AppStateStatus } from '../AppService';
import BackendService from '../BackendService';
import SocketService from '../SocketService';
import LinkingService from '../LinkingService';
import NavigationService, { RootType } from '../NavigationService';
import PushNotificationsService from '../PushNotificationsService';
import AuthenticationService from '../AuthenticationService';

describe('AuthenticationService', () => {
    const authenticationService = AuthenticationService;
    const appService = AppService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(AppService, 'addListener');
        const spy2 = jest.spyOn(AppService, 'removeListener');

        // initialize the service
        await authenticationService.initialize();

        // fake the setRoot command
        NavigationService.emit('setRoot', RootType.OnboardingRoot);
        expect(spy2).toBeCalledWith('appStateChange', AuthenticationService.onAppStateChange);

        // fake the setRoot command
        NavigationService.emit('setRoot', RootType.DefaultRoot);
        expect(spy1).toBeCalledWith('appStateChange', AuthenticationService.onAppStateChange);
    });

    it('should check for lock when coming from inactive/background state', async () => {
        const spy1 = jest.spyOn(authenticationService, 'checkLockScreen').mockImplementation(jest.fn());

        appService.prevAppState = AppStateStatus.Background;
        appService.currentAppState = AppStateStatus.Active;
        appService.emit('appStateChange', AppStateStatus.Active);
        expect(spy1).toBeCalled();

        const spy2 = jest.spyOn(authenticationService, 'checkLockScreen').mockImplementation(jest.fn());

        appService.prevAppState = AppStateStatus.Inactive;
        appService.currentAppState = AppStateStatus.Active;
        appService.emit('appStateChange', AppStateStatus.Active);
        expect(spy2).toBeCalled();

        spy1.mockRestore();
        spy2.mockRestore();
    });

    it('should run the required functions after success auth', async () => {
        jest.useFakeTimers();

        const promiseFn = () => Promise.resolve();
        const spyList = [
            jest.spyOn(AppService, 'checkShowChangeLog').mockImplementationOnce(promiseFn),
            jest.spyOn(AppService, 'checkAppUpdate').mockImplementationOnce(promiseFn),
            jest.spyOn(BackendService, 'ping').mockImplementationOnce(promiseFn),
            jest.spyOn(SocketService, 'connect').mockImplementationOnce(promiseFn),
            jest.spyOn(LinkingService, 'checkInitialDeepLink').mockImplementationOnce(promiseFn),
            jest.spyOn(PushNotificationsService, 'checkInitialNotification').mockImplementationOnce(promiseFn),
        ];

        // call the method
        AuthenticationService.runAfterSuccessAuth();

        setTimeout(() => {
            for (let i = 0; i < spyList.length; i++) {
                expect(spyList[i]).toBeCalledTimes(1);
            }

            // should clear post success array so won't be run in next success auth
            expect(authenticationService.postSuccess).toBe([]);
        }, 1000);
    });
});
