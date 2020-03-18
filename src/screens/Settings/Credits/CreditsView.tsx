/**
 * Credits screen
 */
import React, { Component } from 'react';
import { SafeAreaView, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

import { Navigator } from '@common/helpers';
import { AppScreens, AppConfig } from '@common/constants';

import { Header } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    uri: string;
}

/* Component ==================================================================== */
class CreditsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.Credits;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        let uri = `${AppConfig.creditsURL}${Localize.getCurrentLocale()}`;

        if (__DEV__) {
            uri = uri.replace('https://xumm.app', 'http://10.100.189.74:3001');
        }

        this.state = {
            uri,
        };
    }

    render() {
        const { uri } = this.state;

        return (
            <View testID="credits-view" style={[styles.container]}>
                <Header
                    centerComponent={{ text: Localize.t('settings.credits') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                />
                <SafeAreaView style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <WebView
                        startInLoadingState
                        renderLoading={() => (
                            <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />
                        )}
                        source={{ uri }}
                    />
                </SafeAreaView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default CreditsView;
