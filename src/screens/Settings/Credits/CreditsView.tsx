/**
 * Credits screen
 */
import React, { Component } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Navigator } from '@common/helpers/navigator';
import { hasNotch } from '@common/helpers/device';

import { AppScreens, AppConfig } from '@common/constants';

import { CoreSchema } from '@store/schemas/latest';
import { CoreRepository } from '@store/repositories';

import { Header, LoadingIndicator } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    paddingBottom: number;
    coreSettings: CoreSchema;
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

        this.state = {
            paddingBottom: hasNotch() ? 20 : 0,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    getHeaders = () => {
        const { coreSettings } = this.state;

        return {
            'X-XUMM-Style': coreSettings.theme,
        };
    };

    getURI = () => {
        return `${AppConfig.creditsURL}${Localize.getCurrentLocale()}`;
    };

    render() {
        const { paddingBottom } = this.state;

        return (
            <View testID="credits-view" style={[AppStyles.flex1]}>
                <Header
                    centerComponent={{ text: Localize.t('settings.credits') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                />
                <WebView
                    containerStyle={[AppStyles.flex1, { paddingBottom }]}
                    startInLoadingState
                    renderLoading={() => <LoadingIndicator style={styles.loadingStyle} size="large" />}
                    source={{ uri: this.getURI(), headers: this.getHeaders() }}
                    androidHardwareAccelerationDisabled={false}
                    limitsNavigationsToAppBoundDomains
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default CreditsView;
