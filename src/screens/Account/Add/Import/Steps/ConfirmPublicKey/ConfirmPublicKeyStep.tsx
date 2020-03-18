/**
 * Import Account/Confirm Public Key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Clipboard } from 'react-native';

import { Toast } from '@common/helpers';

// components
import { Button, Footer } from '@components';

// locale
import Localize from '@locale';

import { ImportSteps, AccountObject } from '@screens/Account/Add/Import';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {}

/* Component ==================================================================== */
class ConfirmPublicKeyStep extends Component<Props, State> {
    render() {
        const { account, goNext, goBack } = this.props;

        return (
            <SafeAreaView testID="account-import-account-type" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseConfirmYourAccountAddress')}
                </Text>

                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.centerContent,
                        AppStyles.stretchSelf,
                        AppStyles.paddingHorizontalSml,
                    ]}
                >
                    {/* <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingSml]}>
                        {Localize.t('account.hereIsYourPublicKeyConfirm')}
                    </Text> */}
                    {/* <Spacer size={30} /> */}

                    <View style={[styles.labelWrapper, AppStyles.stretchSelf]}>
                        <Text selectable style={[styles.addressField]}>
                            {account.importedAccount.address}
                        </Text>
                    </View>
                    <Button
                        label={Localize.t('account.copyAddress')}
                        icon="IconClipboard"
                        style={AppStyles.buttonGreyOutline}
                        iconStyle={AppStyles.imgColorGreyDark}
                        textStyle={[AppStyles.colorGreyDark]}
                        onPress={() => {
                            Clipboard.setString(account.importedAccount.address);
                            Toast(Localize.t('account.publicKeyCopiedToClipboard'));
                        }}
                        roundedSmall
                        outline
                    />
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
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.confirm')}
                            onPress={() => {
                                goNext('SecurityStep');
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ConfirmPublicKeyStep;
