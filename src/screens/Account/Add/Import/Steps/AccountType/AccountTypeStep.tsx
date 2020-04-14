/**
 * Import Account/accountType Step
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import { Button, RadioButton, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { ImportSteps, AccountObject } from '@screens/Account/Add/Import/types';
/* types ==================================================================== */
export enum AccountTypes {
    SecretNumbers = 'secretNumbers',
    Passphrase = 'passphrase',
    FamilySeed = 'familySeed',
    Mnemonic = 'mnemonic',
    Hex = 'hex',
}

export interface Props {
    goBack: (step?: ImportSteps, settings?: AccountObject) => void;
    goNext: (step?: ImportSteps, settings?: AccountObject) => void;
}

export interface State {
    accountType: AccountTypes;
}

/* Component ==================================================================== */
class AccountTypeStep extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            accountType: AccountTypes.SecretNumbers,
        };
    }

    onRadioButtonPress = (type: AccountTypes) => {
        this.setState({
            accountType: type,
        });
    };

    goNext = () => {
        const { goNext } = this.props;
        const { accountType } = this.state;
        switch (accountType) {
            case AccountTypes.SecretNumbers:
                goNext('EnterSecretNumbers', { accountType });
                break;
            case AccountTypes.FamilySeed:
                goNext('EnterSeed', { accountType });
                break;
            case AccountTypes.Mnemonic:
                goNext('MnemonicAlert');
                break;
            default:
                break;
        }
    };
    render() {
        const { goBack } = this.props;
        const { accountType } = this.state;
        return (
            <SafeAreaView testID="account-import-account-type" style={[AppStyles.contentContainer]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseSelectAccountSecretType')}
                </Text>

                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(AccountTypes.SecretNumbers);
                        }}
                        label={Localize.t('account.secretNumbers')}
                        description={Localize.t('account.secretNumbersDesc')}
                        checked={accountType === AccountTypes.SecretNumbers}
                    />

                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(AccountTypes.FamilySeed);
                        }}
                        label={Localize.t('account.familySeed')}
                        description={Localize.t('account.familySeedDesc')}
                        checked={accountType === AccountTypes.FamilySeed}
                    />

                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(AccountTypes.Mnemonic);
                        }}
                        label={Localize.t('account.mnemonic')}
                        description={Localize.t('account.mnemonicDesc')}
                        checked={accountType === AccountTypes.Mnemonic}
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
                            label={Localize.t('global.next')}
                            onPress={() => {
                                this.goNext();
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountTypeStep;
