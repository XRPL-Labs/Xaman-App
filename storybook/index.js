import { Navigation } from 'react-native-navigation';
import { getStorybookUI, configure } from '@storybook/react-native';

import './rn-addons';

// import stories
configure(() => {
    require('./stories');
}, module);

// Refer to https://github.com/storybookjs/storybook/tree/master/app/react-native#start-command-parameters
// To find allowed options for getStorybookUI
const StorybookUIRoot = getStorybookUI({ asyncStorage: null });

// If you are using React Native vanilla and after installation you don't see your app name here, write it manually.
// If you use Expo you can safely remove this line.
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
