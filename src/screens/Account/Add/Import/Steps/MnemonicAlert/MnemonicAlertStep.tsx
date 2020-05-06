/**
 * Import Account/Mnemonic alert step
 */

import React, { Component } from 'react';
import { SafeAreaView, TouchableOpacity, View, Text, Image, Linking } from 'react-native';
import { XRPL_Account } from 'xrpl-accountlib';

// components
import { Button, Icon, Footer, Spacer } from '@components';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

import { ImportSteps, AccountObject } from '@screens/Account/Add/Import/types';

// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    account: XRPL_Account;
    goBack: (step?: ImportSteps, settings?: AccountObject) => void;
    goNext: (step?: ImportSteps, settings?: AccountObject) => void;
}

export interface State {}

/* Component ==================================================================== */
class MnemonicAlertStep extends Component<Props, State> {
    openFAQ = () => {
        const url = 'https://support.xumm.app/en/articles/3852597-how-does-xumm-security-compare-to-a-hardware-wallet';
        Linking.openURL(url);
    };

    render() {
        const { goNext, goBack } = this.props;

        return (
            <SafeAreaView testID="account-generate-explanation-private" style={[AppStyles.pageContainerFull]}>
                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image style={[AppStyles.emptyIcon]} source={Images.ImageWarningShield} />

                    <Spacer />
                    {/* eslint-disable-next-line */}
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        {Localize.t('account.mnemonicLargeAmountAlert')}
                    </Text>

                    <TouchableOpacity
                        style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                        onPress={this.openFAQ}
                    >
                        <Icon
                            name="IconLink"
                            size={20}
                            style={[AppStyles.imgColorGreyDark, AppStyles.marginRightSml]}
                        />
                        <Text
                            style={[
                                AppStyles.subtext,
                                AppStyles.textCenterAligned,
                                AppStyles.link,
                                AppStyles.colorGreyDark,
                            ]}
                        >
                            {Localize.t('global.readMoreInTheFAQ')}
                        </Text>
                    </TouchableOpacity>
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
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={() => {
                                goNext('EnterMnemonic', { accountType: 'mnemonic' });
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default MnemonicAlertStep;
