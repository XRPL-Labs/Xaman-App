import { LogBox } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { getStorybookUI, configure } from '@storybook/react-native';
import { loadStories } from './storyLoader';

import './rn-addons';

LogBox.ignoreLogs(['EventEmitter', 'Require cycle']);

configure(() => {
    loadStories();
}, module);

const StorybookUIRoot = getStorybookUI({ asyncStorage: null });

Navigation.registerComponent('storybook.UI', () => StorybookUIRoot);

Navigation.events().registerAppLaunchedListener(async () => {
    Navigation.setRoot({
        root: {
            stack: {
                children: [
                    {
                        component: {
                            name: 'storybook.UI',
                            options: {
                                topBar: {
                                    visible: false,
                                },
                            },
                        },
                    },
                ],
            },
        },
    });
});

export default StorybookUIRoot;
