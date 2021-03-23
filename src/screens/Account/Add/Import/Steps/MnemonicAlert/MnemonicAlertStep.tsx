/**
 * Import Account/Mnemonic alert step
 */

import React, { Component } from 'react';
import { SafeAreaView, TouchableOpacity, View, Text, Image, Linking, Alert } from 'react-native';

import StyleService from '@services/StyleService';

// components
import { Button, Icon, Footer, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class MnemonicAlertStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    openFAQ = () => {
        const url = 'http://xumm.app/redir/faq/security-hardware/en';

        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            }
        });
    };

    goNext = () => {
        const { goNext } = this.context;
        goNext('EnterMnemonic');
    };

    render() {
        const { goBack } = this.context;

        return (
            <SafeAreaView testID="account-import-mnemonic-alert-view" style={[AppStyles.container]}>
                <View style={[AppStyles.contentContainer, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageWarningShield')} />

                    <Spacer />
                    {/* eslint-disable-next-line */}
                    <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                        {Localize.t('account.mnemonicLargeAmountAlert')}
                    </Text>

                    <TouchableOpacity
                        style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                        onPress={this.openFAQ}
                    >
                        <Icon name="IconLink" size={20} style={[AppStyles.imgColorGrey, AppStyles.marginRightSml]} />
                        <Text
                            style={[
                                AppStyles.subtext,
                                AppStyles.textCenterAligned,
                                AppStyles.link,
                                AppStyles.colorGrey,
                            ]}
                        >
                            {Localize.t('global.readMoreInTheFAQ')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.nextIUnderstand')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default MnemonicAlertStep;
