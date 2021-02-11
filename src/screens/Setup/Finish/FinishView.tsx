/**
 * Setup Agreement/Finish Screen
 */

import { isNumber } from 'lodash';
import React, { Component } from 'react';

import { View, SafeAreaView, ActivityIndicator, Image, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

import { CoreRepository, ProfileRepository } from '@store/repositories';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens, AppConfig } from '@common/constants';

import { BackendService, AuthenticationService } from '@services';

import Localize from '@locale';

// component
import { Button, Footer } from '@components/General';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    TOSVersion: number;
    isTOSLoaded: boolean;
    isLoading: boolean;
}

/* Component ==================================================================== */
class FinishView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Finish;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            TOSVersion: 0,
            isTOSLoaded: false,
            isLoading: false,
        };
    }

    onConfirmPress = async () => {
        const { TOSVersion } = this.state;

        this.setState({
            isLoading: true,
        });

        try {
            // init user in the xumm
            const { user, device } = await BackendService.initUser();

            // register the device in xumm
            const accessToken = await BackendService.activateDevice(user, device);

            // create empty profile and store access token
            // save the signed TOS version and date
            ProfileRepository.saveProfile({
                uuid: user.uuid,
                deviceUUID: device.uuid,
                accessToken,
                signedTOSDate: new Date(),
                signedTOSVersion: TOSVersion,
            });

            // set the initialized flag to true
            CoreRepository.saveSettings({ initialized: true });

            // run post services after success auth
            AuthenticationService.onSuccessAuthentication();

            // navigate to default root
            Navigator.startDefault();
        } catch (e) {
            this.setState({
                isLoading: false,
            });
            Alert.alert('Error', e.message || e);
        }
    };

    fetchTOSVersion = (event: any) => {
        try {
            const { data } = event.nativeEvent;
            const { version } = JSON.parse(data);
            if (isNumber(version)) {
                this.setState({
                    TOSVersion: version,
                });
            }
        } catch {
            // ignore
        }
    };

    render() {
        const { isLoading, isTOSLoaded } = this.state;
        return (
            <SafeAreaView testID="agreement-setup-screen" style={[AppStyles.flex1]}>
                <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.centerAligned]}>
                    <Image style={styles.logo} source={Images.xummLogo} />
                </View>

                <View style={[AppStyles.flex8, AppStyles.centerContent]}>
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
                        source={{ uri: AppConfig.termOfUseURL }}
                    />
                </View>

                <Footer>
                    <Button
                        numberOfLines={1}
                        isDisabled={!isTOSLoaded}
                        testID="confirm-button"
                        isLoading={isLoading}
                        onPress={this.onConfirmPress}
                        label={Localize.t('global.confirm')}
                    />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default FinishView;
