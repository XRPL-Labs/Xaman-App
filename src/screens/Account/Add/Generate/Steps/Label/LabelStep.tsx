/**
 * Generate Account/Label Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardAvoidingView } from 'react-native';

// components
import { Button, Spacer, TextInput, Footer } from '@components';

// locale
import Localize from '@locale';

import { GenerateSteps, AccountObject } from '@screens/Account/Add/Generate/types';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: GenerateSteps, settings?: AccountObject) => void;
    goNext: (step?: GenerateSteps, settings?: AccountObject) => void;
}

export interface State {
    label: string;
}

/* Component ==================================================================== */
class LabelStep extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            label: '',
        };
    }

    goNext = () => {
        const { goNext } = this.props;
        const { label } = this.state;

        if (label.length > 16) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountMaxLabelLengthError'));
            return;
        }

        goNext('FinishStep', { label: label.trim() });
    };

    render() {
        const { goBack } = this.props;
        const { label } = this.state;
        return (
            <SafeAreaView testID="account-generate-finish-view" style={[AppStyles.pageContainerFull]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseChooseAccountLabel')}
                </Text>

                <Spacer size={50} />
                <KeyboardAvoidingView
                    behavior="padding"
                    style={[AppStyles.contentContainer, AppStyles.flexStart, AppStyles.paddingSml]}
                >
                    <TextInput
                        maxLength={16}
                        placeholder={Localize.t('account.accountLabel')}
                        value={label}
                        onChangeText={l => this.setState({ label: l })}
                        inputStyle={styles.inputText}
                        containerStyle={styles.inputContainer}
                    />
                </KeyboardAvoidingView>
                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={() => {
                                goBack();
                            }}
                            secondary
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            isDisabled={!label.trim()}
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
export default LabelStep;
