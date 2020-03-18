/**
 * Setup Permissions Screen
 */

import React, { Component } from 'react';

import { View, Text, Image, SafeAreaView } from 'react-native';

import { Images, Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';
import { PushNotificationsService } from '@services';
import { Footer, Button, Spacer } from '@components';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    passcode: string;
}

export interface State {}

/* Component ==================================================================== */
class PermissionsSetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Permissions;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    requestPermission = () => {
        PushNotificationsService.requestPermission().then(granted => {
            if (granted) {
                this.nextStep();
            }
        });
    };

    nextStep = () => {
        Navigator.push(AppScreens.Setup.Finish);
    };

    render() {
        return (
            <SafeAreaView testID="permission-setup-view" style={[AppStyles.container]}>
                <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                    <Image style={styles.logo} source={Images.xummLogo} />
                </View>

                <View style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageNotifications} />
                    </View>

                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('setupPermissions.enableNotifications')}
                        </Text>
                        <Spacer size={20} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('setupPermissions.permissionDescription')}
                        </Text>
                    </View>
                </View>

                <Footer style={[AppStyles.paddingBottom]}>
                    <Button light label={Localize.t('global.maybeLater')} onPress={this.nextStep} />
                    <Spacer />
                    <Button label={Localize.t('global.yes')} onPress={this.requestPermission} />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default PermissionsSetupView;
