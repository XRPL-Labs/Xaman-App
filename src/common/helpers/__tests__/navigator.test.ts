import { Navigation } from 'react-native-navigation';

import { Navigator } from '../navigator';

import NavigationService, { ComponentTypes } from '../../../services/NavigationService';
import AppScreens from '../../constants/screens';

describe('Navigator helper', () => {
    const navigationService = NavigationService;

    beforeAll(() => {
        navigationService.setCurrentScreen(AppScreens.TabBar.Home);
    });

    it('should include component type in passProps when presenting component', () => {
        const screen = AppScreens.Settings.General;
        const modal = AppScreens.Modal.XAppBrowser;
        const overlay = AppScreens.Overlay.Alert;

        const showScreenSpy = jest.spyOn(Navigation, 'push');
        const showModalSpy = jest.spyOn(Navigation, 'showModal');
        const showOverlaySpy = jest.spyOn(Navigation, 'showOverlay');

        Navigator.push(screen);
        Navigator.showModal(modal);
        Navigator.showOverlay(overlay);

        expect(showScreenSpy).toBeCalledWith(AppScreens.TabBar.Home, {
            component: {
                name: screen,
                id: screen,
                passProps: { componentType: ComponentTypes.Screen },
                options: {},
            },
        });

        expect(showModalSpy).toBeCalledWith({
            stack: {
                children: [
                    {
                        component: {
                            name: modal,
                            id: modal,
                            options: {},
                            passProps: { componentType: ComponentTypes.Modal },
                        },
                    },
                ],
                id: modal,
            },
        });

        expect(showOverlaySpy).toBeCalledWith({
            component: {
                name: overlay,
                id: overlay,
                passProps: { componentType: ComponentTypes.Overlay },
                options: {},
            },
        });
    });
});
