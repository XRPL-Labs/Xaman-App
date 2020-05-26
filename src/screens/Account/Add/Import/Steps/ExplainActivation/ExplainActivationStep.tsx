/**
 * Generate Account Activation explain
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Image } from 'react-native';

// components
import { Button, Spacer, Footer } from '@components';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

import { ImportSteps, AccountObject } from '@screens/Account/Add/Import/types';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: ImportSteps, settings?: AccountObject) => void;
    goNext: (step?: ImportSteps, settings?: AccountObject) => void;
}

export interface State {}

/* Component ==================================================================== */
class ExplainActivationStep extends Component<Props, State> {
    render() {
        const { goNext, goBack } = this.props;

        return (
            <SafeAreaView testID="account-generate-explain-activation" style={[AppStyles.container]}>
                <View style={[AppStyles.centerAligned, AppStyles.marginVerticalSml]}>
                    <Image style={[styles.headerImage]} source={Images.ImageCoinWallet} />
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.baseText, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountImportActivationExplain')}
                    </Text>

                    <Spacer size={30} />

                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountActivateReserveExplain')}
                    </Text>

                    <Spacer size={20} />

                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('account.accountReserveNotShownExplain')}
                    </Text>

                    <Spacer size={20} />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={() => {
                                goBack();
                            }}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={() => {
                                goNext('SecurityStep');
                            }}
                            textStyle={AppStyles.strong}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ExplainActivationStep;
