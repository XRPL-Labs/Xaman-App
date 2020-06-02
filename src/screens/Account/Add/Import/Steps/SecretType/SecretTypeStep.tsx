/**
 * Import Account/secretType Step
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import { Button, RadioButton, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export enum SecretTypes {
    SecretNumbers = 'secretNumbers',
    Passphrase = 'passphrase',
    FamilySeed = 'familySeed',
    Mnemonic = 'mnemonic',
    Hex = 'hex',
}

export interface Props {}

export interface State {
    secretType: SecretTypes;
}

/* Component ==================================================================== */
class SecretTypeStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            secretType: SecretTypes.SecretNumbers,
        };
    }

    onRadioButtonPress = (type: SecretTypes) => {
        this.setState({
            secretType: type,
        });
    };

    goNext = () => {
        const { goNext } = this.context;
        const { secretType } = this.state;
        switch (secretType) {
            case SecretTypes.SecretNumbers:
                goNext('EnterSecretNumbers');
                break;
            case SecretTypes.FamilySeed:
                goNext('EnterSeed');
                break;
            case SecretTypes.Mnemonic:
                goNext('MnemonicAlert');
                break;
            default:
                break;
        }
    };
    render() {
        const { goBack } = this.context;
        const { secretType } = this.state;
        return (
            <SafeAreaView testID="account-import-account-type" style={[AppStyles.contentContainer]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseSelectAccountSecretType')}
                </Text>

                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(SecretTypes.SecretNumbers);
                        }}
                        label={Localize.t('account.secretNumbers')}
                        description={Localize.t('account.secretNumbersDesc')}
                        checked={secretType === SecretTypes.SecretNumbers}
                    />

                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(SecretTypes.FamilySeed);
                        }}
                        label={Localize.t('account.familySeed')}
                        description={Localize.t('account.familySeedDesc')}
                        checked={secretType === SecretTypes.FamilySeed}
                    />

                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(SecretTypes.Mnemonic);
                        }}
                        label={Localize.t('account.mnemonic')}
                        description={Localize.t('account.mnemonicDesc')}
                        checked={secretType === SecretTypes.Mnemonic}
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
export default SecretTypeStep;
