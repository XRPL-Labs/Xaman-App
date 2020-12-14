/**
 * Import Account/Confirm Public Key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ScrollView } from 'react-native';

import Clipboard from '@react-native-community/clipboard';

import { AccountRepository } from '@store/repositories';
import { AccountTypes } from '@store/types';

import { Toast, Prompt } from '@common/helpers/interface';

// components
import { Button, Footer, Icon, Spacer } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class ConfirmPublicKeyStep extends Component<Props, State> {
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
        const { goNext, account } = this.context;

        if (account.type === AccountTypes.Regular) {
            goNext('SecurityStep');
        } else {
            goNext('LabelStep');
        }
    };

    renderRegularKeys = () => {
        const { importedAccount } = this.context;

        const isRegularKey = AccountRepository.isRegularKey(importedAccount.address);

        if (isRegularKey) {
            const keysForAccounts = AccountRepository.findBy('regularKey', importedAccount.address);

            return (
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.centerContent,
                        AppStyles.stretchSelf,
                        AppStyles.paddingHorizontalSml,
                    ]}
                >
                    <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Icon name="IconKey" size={20} style={AppStyles.imgColorGreen} />
                        <Text style={[AppStyles.p, AppStyles.bold, AppStyles.colorGreen]}>
                            {' '}
                            {Localize.t('global.regularKey')}
                        </Text>
                    </View>
                    <Spacer size={5} />
                    <View style={[AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Text style={[AppStyles.subtext, AppStyles.colorGreen]}>
                            {Localize.t('account.toTheseExistingAccounts')}
                        </Text>
                    </View>

                    <Spacer size={10} />
                    <View style={[AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Icon size={20} name="IconArrowDown" />
                    </View>
                    <Spacer size={10} />

                    <ScrollView contentContainerStyle={[AppStyles.flex1]}>
                        {keysForAccounts.map((a, index) => {
                            return (
                                <View key={index} style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}>
                                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.centerAligned]}>
                                        <View style={styles.iconContainer}>
                                            <Icon size={25} style={AppStyles.imgColorGreyDark} name="IconAccount" />
                                        </View>

                                        <View>
                                            <Text style={[AppStyles.p, AppStyles.bold]}>{a.label}</Text>
                                            <Text
                                                style={[AppStyles.subtext, AppStyles.monoBold, AppStyles.colorGreyDark]}
                                            >
                                                {a.address}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            );
        }

        return null;
    };

    render() {
        const { importedAccount, isLoading } = this.context;

        if (!importedAccount) {
            return null;
        }

        return (
            <SafeAreaView testID="account-import-show-address-view" style={[AppStyles.container]}>
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
                    <View style={[styles.labelWrapper, AppStyles.stretchSelf]}>
                        <Text testID="account-address-text" selectable style={[styles.addressField]}>
                            {importedAccount.address}
                        </Text>
                    </View>
                    <Button
                        label={Localize.t('account.copyAddress')}
                        icon="IconClipboard"
                        style={AppStyles.buttonBlueLight}
                        iconStyle={AppStyles.imgColorGreyDark}
                        textStyle={[AppStyles.colorGreyDark]}
                        onPress={() => {
                            Clipboard.setString(importedAccount.address);
                            Toast(Localize.t('account.publicKeyCopiedToClipboard'));
                        }}
                        roundedSmall
                        outline
                    />
                </View>

                {this.renderRegularKeys()}

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.confirm')}
                            onPress={this.goNext}
                            isLoading={isLoading}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ConfirmPublicKeyStep;
