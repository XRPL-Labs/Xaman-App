/**
 * Term Of Use view screen
 */
import { isNumber } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, ActivityIndicator, BackHandler } from 'react-native';
import { WebView } from 'react-native-webview';

import { Navigator, getStatusBarHeight } from '@common/helpers';
import { AppScreens, AppConfig } from '@common/constants';

import { ProfileRepository } from '@store/repositories';
import { Header, Footer, Spacer, Button } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    asModal: boolean;
}

export interface State {
    TOSVersion: number;
    isTOSLoaded: boolean;
    shouldShowAgreement: boolean;
    uri: string;
}

/* Component ==================================================================== */
class TermOfUseView extends Component<Props, State> {
    static screenName = AppScreens.Settings.TermOfUse;
    private backHandler: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        let uri = `${AppConfig.termOfUseURL}${Localize.getCurrentLocale()}`;

        if (__DEV__) {
            uri = uri.replace('https://xumm.app', 'http://10.100.189.74:3001');
        }

        this.state = {
            TOSVersion: undefined,
            isTOSLoaded: false,
            shouldShowAgreement: false,
            uri,
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        const { asModal } = this.props;

        if (asModal) {
            this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        }
    }

    fetchTOSVersion = (event: any) => {
        try {
            const { data } = event.nativeEvent;
            const { version } = JSON.parse(data);

            if (isNumber(version)) {
                const profile = ProfileRepository.getProfile();

                this.setState({
                    TOSVersion: version,
                    shouldShowAgreement: profile.signedTOSVersion < version,
                });
            }
        } catch {
            // ignore
        }
    };

    onAgreementPress = () => {
        const { asModal } = this.props;
        const { TOSVersion } = this.state;

        ProfileRepository.saveProfile({
            signedTOSVersion: TOSVersion,
            signedTOSDate: new Date(),
        });

        if (asModal) {
            Navigator.dismissModal();
        } else {
            Navigator.pop();
        }
    };

    render() {
        const { asModal } = this.props;
        const { uri, isTOSLoaded, shouldShowAgreement } = this.state;
        return (
            <View testID="term-of-use-view" style={[styles.container]}>
                {asModal ? (
                    <View style={[AppStyles.centerAligned, { paddingTop: getStatusBarHeight() }]}>
                        <Text style={AppStyles.h5}>{Localize.t('settings.termsAndConditions')}</Text>
                    </View>
                ) : (
                    <Header
                        centerComponent={{ text: Localize.t('settings.termsAndConditions') }}
                        leftComponent={{
                            icon: 'IconChevronLeft',
                            onPress: () => {
                                Navigator.pop();
                            },
                        }}
                    />
                )}

                <SafeAreaView style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <WebView
                        startInLoadingState
                        onMessage={this.fetchTOSVersion}
                        onLoadEnd={() => {
                            this.setState({
                                isTOSLoaded: true,
                            });
                        }}
                        renderLoading={() => (
                            <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />
                        )}
                        source={{ uri }}
                    />
                </SafeAreaView>

                {shouldShowAgreement && (
                    <Footer>
                        <Button
                            isDisabled={!isTOSLoaded}
                            testID="confirm-button"
                            onPress={this.onAgreementPress}
                            label={Localize.t('global.confirm')}
                        />
                        <Spacer />
                    </Footer>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default TermOfUseView;
