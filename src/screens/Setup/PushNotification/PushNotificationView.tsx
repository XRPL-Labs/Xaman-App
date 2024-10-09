/**
 * Setup Permissions Screen
 */

import React, { Component } from 'react';

import { View, Text, Image, SafeAreaView, Platform, Alert, Linking } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { PushNotificationsService, StyleService } from '@services';

import { Footer, Button, Spacer } from '@components/General';

import Localize from '@locale';

import { FinishSetupViewProps } from '@screens/Setup/Finish';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class PushNotificationSetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.PushNotification;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
        };
    }

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    openAppSettings = () => {
        Linking.openSettings();
    };

    requestPermission = () => {
        this.setState({
            isLoading: true,
        });

        PushNotificationsService.requestPermission()
            .then((granted) => {
                if (granted) {
                    this.nextStep();
                    return;
                }

                if (Platform.OS === 'ios') {
                    Alert.alert(
                        Localize.t('global.error'),
                        Localize.t('global.pushErrorPermissionMessage'),
                        [
                            { text: Localize.t('global.approvePermissions'), onPress: this.openAppSettings },
                            { text: Localize.t('global.cancel') },
                        ],
                        { cancelable: true },
                    );
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.UnableToRegisterPushNotifications'));
                }
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    nextStep = () => {
        Navigator.push<FinishSetupViewProps>(AppScreens.Setup.Finish, {});
    };

    render() {
        const { isLoading } = this.state;

        return (
            <SafeAreaView testID="permission-setup-view" style={AppStyles.container}>
                <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                    <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                </View>

                <View style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageNotifications')} />
                    </View>

                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[AppStyles.h5, AppStyles.strong, AppStyles.textCenterAligned]}>
                            {Localize.t('setupPermissions.enableNotifications')}
                        </Text>
                        <Spacer size={20} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('setupPermissions.permissionDescription')}
                        </Text>
                    </View>
                </View>

                <Footer style={AppStyles.paddingBottom}>
                    <Button numberOfLines={1} light label={Localize.t('global.maybeLater')} onPress={this.nextStep} />
                    <Spacer />
                    <Button
                        isLoading={isLoading}
                        numberOfLines={1}
                        label={Localize.t('global.yes')}
                        onPress={this.requestPermission}
                    />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default PushNotificationSetupView;
