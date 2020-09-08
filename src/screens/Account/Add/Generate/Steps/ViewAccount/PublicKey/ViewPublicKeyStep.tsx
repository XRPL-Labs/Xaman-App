/**
 * Generate Account/View Public Key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Clipboard, ActivityIndicator } from 'react-native';

import { Toast, Prompt } from '@common/helpers/interface';

// components
import { Button, Footer, Spacer } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {}
/* Component ==================================================================== */
class ViewPublicKeyStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    goBack = () => {
        const { goBack } = this.context;

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
        const { generatedAccount, goNext } = this.context;

        return (
            <SafeAreaView testID="account-generate-show-address-view" style={[AppStyles.container]}>
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
                        {generatedAccount ? (
                            <Text testID="account-address-text" selectable style={[styles.addressField]}>
                                {generatedAccount.address}
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
                            Clipboard.setString(generatedAccount.address);
                            Toast(Localize.t('account.publicKeyCopiedToClipboard'));
                        }}
                        roundedSmall
                        outline
                    />
                </View>

                <Footer style={[AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            // secondary
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            isDisabled={!generatedAccount}
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
