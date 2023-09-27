import React, { Component } from 'react';
import { View } from 'react-native';
import { Navigation } from 'react-native-navigation';
import { NativeFixtureLoader } from 'react-cosmos-native';
import { rendererConfig, moduleWrappers } from './cosmos.imports';

class CosmosApp extends Component {
    render() {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                }}
            >
                {NativeFixtureLoader({
                    rendererConfig,
                    moduleWrappers,
                })}
            </View>
        );
    }
}

Navigation.registerComponent('Cosmos.UI', () => CosmosApp);

Navigation.events().registerAppLaunchedListener(async () => {
    Navigation.setRoot({
        root: {
            stack: {
                children: [
                    {
                        component: {
                            name: 'Cosmos.UI',
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

export default CosmosApp;
