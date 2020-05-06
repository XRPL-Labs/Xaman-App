/**
 * Generate Account/Finish Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ImageBackground, Image } from 'react-native';
import { XRPL_Account } from 'xrpl-accountlib';

import { Images } from '@common/helpers/images';
// components
import { Button, Footer } from '@components';

import Localize from '@locale';

import { GenerateSteps, AccountObject } from '@screens/Account/Add/Generate/types';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: XRPL_Account;
    goBack: (step?: GenerateSteps, settings?: AccountObject) => void;
    goNext: (step?: GenerateSteps, settings?: AccountObject) => void;
}

export interface State {}

/* Component ==================================================================== */
class FinishStep extends Component<Props, State> {
    render() {
        const { goNext } = this.props;

        return (
            <SafeAreaView style={[AppStyles.flex1]}>
                <ImageBackground
                    testID="account-generate-finish-view"
                    source={Images.backgroundPattern}
                    style={[AppStyles.container]}
                    imageStyle={styles.backgroundImageStyle}
                >
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.paddingSml,
                            AppStyles.centerAligned,
                            AppStyles.centerContent,
                        ]}
                    >
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageComplete} />
                        <Text style={AppStyles.h5}>{Localize.t('global.congratulations')}</Text>
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                            {Localize.t('account.accountSetupCompleted')}
                            {'\n'}
                            {Localize.t('account.YouJustCreatedAccount')}
                        </Text>
                    </View>

                    <Footer>
                        <Button
                            label={Localize.t('account.yeahLetsGo')}
                            onPress={() => {
                                goNext();
                            }}
                        />
                    </Footer>
                </ImageBackground>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default FinishStep;
