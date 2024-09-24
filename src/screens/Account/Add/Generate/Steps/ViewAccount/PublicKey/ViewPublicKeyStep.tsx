/**
 * Generate Account/View Public Key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import { Toast, Prompt } from '@common/helpers/interface';
import { Clipboard } from '@common/helpers/clipboard';

// components
import { Button, Footer, Spacer, LoadingIndicator } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
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

    goNext = () => {
        const { goNext } = this.context;

        goNext('ExplainActivation');
    };

    copyPubKeyToClipboard = () => {
        const { generatedAccount } = this.context;

        Clipboard.setString(generatedAccount.address);
        Toast(Localize.t('account.publicKeyCopiedToClipboard'));
    };

    render() {
        const { generatedAccount } = this.context;

        return (
            <SafeAreaView testID="account-generate-show-address-view" style={AppStyles.container}>
                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.paddingSml]}>
                    <Text style={AppStyles.h3}>{Localize.t('global.great')}</Text>
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        {Localize.t('account.hereIsYourPublicKey')}
                    </Text>
                    <Spacer size={30} />
                    <Text style={[AppStyles.pbold, AppStyles.paddingBottomSml]}>
                        {Localize.t('account.publicAddress')}
                    </Text>
                    <View style={[styles.labelWrapper, AppStyles.stretchSelf]}>
                        {generatedAccount ? (
                            <Text testID="account-address-text" selectable style={styles.addressField}>
                                {generatedAccount.address}
                            </Text>
                        ) : (
                            <LoadingIndicator />
                        )}
                    </View>
                    <Button
                        light
                        label={Localize.t('account.copyAddress')}
                        icon="IconClipboard"
                        onPress={this.copyPubKeyToClipboard}
                        roundedSmall
                    />
                </View>

                <Footer style={AppStyles.row}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            isDisabled={!generatedAccount}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ViewPublicKeyStep;
