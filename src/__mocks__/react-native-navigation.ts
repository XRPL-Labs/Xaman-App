import { OptionsModalTransitionStyle, OptionsModalPresentationStyle } from 'react-native-navigation';

const Navigation = {
    setRoot: jest.fn(),
    pop: jest.fn(),
    push: jest.fn(),
    showModal: jest.fn(),
    dismissModal: jest.fn(),
    dismissAllModals: jest.fn(),
    popToRoot: jest.fn(),
    mergeOptions: jest.fn(),
    showOverlay: jest.fn(),
    dismissOverlay: jest.fn(),
    registerComponent: jest.fn(),
    events: jest.fn(() => ({
        registerAppLaunchedListener: jest.fn(),
        registerComponentDidAppearListener: jest.fn(),
        bindComponent: jest.fn(),
    })),
};

export { Navigation, OptionsModalTransitionStyle, OptionsModalPresentationStyle };
