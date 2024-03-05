/**
 * Term Of Use view screen
 */
import { isNumber } from 'lodash';
import React, { Component } from 'react';
import { View, Text, BackHandler, NativeEventSubscription } from 'react-native';

import { HasBottomNotch } from '@common/helpers/device';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens, AppConfig } from '@common/constants';

import { ProfileRepository, CoreRepository } from '@store/repositories';

import { WebViewBrowser, Header, Footer, Spacer, Button } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';

/* Component ==================================================================== */
class TermOfUseView extends Component<Props, State> {
    static screenName = AppScreens.Settings.TermOfUse;

    private backHandler: NativeEventSubscription | undefined;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            TOSVersion: 0,
            isTOSLoaded: false,
            shouldShowAgreement: false,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    componentDidMount() {
        const { asModal } = this.props;

        if (asModal) {
            this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        }
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
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
                    shouldShowAgreement: (profile?.signedTOSVersion ?? 0) < version,
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

    getHeaders = () => {
        const { coreSettings } = this.state;

        if (coreSettings) {
            return {
                'X-Xaman-Style': coreSettings.theme,
            };
        }
        return {};
    };

    getURI = () => {
        return `${AppConfig.termOfUseURL}${Localize.getCurrentLocale()}`;
    };

    onTOSLoaded = () => {
        this.setState({
            isTOSLoaded: true,
        });
    };

    render() {
        const { asModal } = this.props;
        const { isTOSLoaded, shouldShowAgreement } = this.state;

        const paddingBottom = HasBottomNotch() && !shouldShowAgreement ? 20 : 0;

        return (
            <View testID="term-of-use-view" style={styles.container}>
                {asModal ? (
                    <View style={[AppStyles.centerAligned, { paddingTop: AppSizes.statusBarHeight }]}>
                        <Text style={AppStyles.h5}>{Localize.t('settings.termsAndConditions')}</Text>
                    </View>
                ) : (
                    <Header
                        centerComponent={{ text: Localize.t('settings.termsAndConditions') }}
                        leftComponent={{
                            icon: 'IconChevronLeft',
                            onPress: Navigator.pop,
                        }}
                    />
                )}

                <WebViewBrowser
                    startInLoadingState
                    containerStyle={{ paddingBottom }}
                    onMessage={this.fetchTOSVersion}
                    onLoadEnd={this.onTOSLoaded}
                    source={{ uri: this.getURI(), headers: this.getHeaders() }}
                    errorMessage={Localize.t('errors.unableToLoadTermOfService')}
                />

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
