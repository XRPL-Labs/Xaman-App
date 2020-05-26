/**
 * Generate Account/View Public Key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Clipboard, ActivityIndicator } from 'react-native';

import { Toast, Prompt } from '@common/helpers/interface';

// components
import { Button, Footer, Spacer } from '@components';

// locale
import Localize from '@locale';

import { GenerateSteps, AccountObject } from '@screens/Account/Add/Generate/types';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: GenerateSteps, settings?: AccountObject) => void;
    goNext: (step?: GenerateSteps, settings?: AccountObject) => void;
}

export interface State {}

/* Component ==================================================================== */
class ViewPublicKeyStep extends Component<Props, State> {
    goBack = () => {
        const { goBack } = this.props;

        Prompt(
            Localize.t('global.pleaseNote'),
            Localize.t('account.goBackRefillTheInput'),
            [
                {
                    text: Localize.t('global.goBack'),
                    onPress: () => {
                        goBack();
                    },
                    style: 'destructive',
                },
                { text: Localize.t('global.cancel') },
            ],
            { type: 'default' },
        );
    };

    render() {
        const { account, goNext } = this.props;
        return (
            <SafeAreaView testID="account-generate-step-view-public" style={[AppStyles.container]}>
                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Text style={[AppStyles.h3]}>{Localize.t('global.great')}</Text>
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        {Localize.t('account.hereIsYourPublicKey')}
                    </Text>
                    <Spacer size={30} />
                    <Text style={[AppStyles.pbold, AppStyles.paddingBottomSml]}>
                        {Localize.t('account.publicAddress')}
                    </Text>
                    <View style={[styles.labelWrapper, AppStyles.stretchSelf]}>
                        {account.generatedAccount ? (
                            <Text selectable style={[styles.addressField]}>
                                {account.generatedAccount.address}
                            </Text>
                        ) : (
                            <ActivityIndicator color={AppColors.blue} />
                        )}
                    </View>
                    <Button
                        label={Localize.t('account.copyAddress')}
                        icon="IconClipboard"
                        style={AppStyles.buttonGreyOutline}
                        iconStyle={AppStyles.imgColorGreyDark}
                        textStyle={[AppStyles.colorGreyDark]}
                        onPress={() => {
                            Clipboard.setString(account.generatedAccount.address);
                            Toast(Localize.t('account.publicKeyCopiedToClipboard'));
                        }}
                        roundedSmall
                        outline
                    />
                </View>

                <Footer style={[AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            // secondary
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            isDisabled={!account.generatedAccount}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={() => {
                                goNext('ExplainActivation');
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ViewPublicKeyStep;
