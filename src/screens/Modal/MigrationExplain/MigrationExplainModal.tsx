/**
 * Encryption migration explain Modal
 */

import React, { Component } from 'react';
import { View, Text, Image, BackHandler, ScrollView, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { Button, InfoMessage, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class MigrationExplainModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.MigrationExplain;

    private backHandler: NativeEventSubscription | undefined;

    constructor(props: Props) {
        super(props);
    }

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    onClose = () => {
        Navigator.dismissModal();
        return true;
    };

    render() {
        return (
            <View style={styles.container}>
                <View style={[AppStyles.row, AppStyles.paddingTop]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h5}>{Localize.t('account.updateEncryption')}</Text>
                    </View>
                    <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
                        <Button
                            roundedSmall
                            light
                            label={Localize.t('global.close').toUpperCase()}
                            onPress={this.onClose}
                        />
                    </View>
                </View>

                <ScrollView bounces={false} style={AppStyles.padding} contentContainerStyle={AppStyles.flex1}>
                    <View style={styles.headerImageContainer}>
                        <Image
                            style={styles.headerImage}
                            resizeMode="contain"
                            source={Images.ImageEncryptionMigration}
                        />
                    </View>
                    <Spacer />
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.whyUseThisNewEncryptionMethod')}
                    </Text>
                    <Spacer size={20} />
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        {Localize.t('account.newEncryptionExplain')}
                    </Text>
                    <Spacer size={20} />
                    <InfoMessage
                        type="error"
                        label={Localize.t('account.doNotTurnOffYourPhoneOrQuiteWhileMigration')}
                    />
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default MigrationExplainModal;
