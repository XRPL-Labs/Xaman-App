/**
 * import Account/Label Screen
 */

import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardAvoidingView } from 'react-native';

import { getAccountInfo } from '@common/helpers';
// components
import { Button, TextInput, Spacer, Footer } from '@components';

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

    componentDidMount() {
        const { account } = this.props;

        getAccountInfo(account.importedAccount.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        label: res.name || '',
                    });
                }
            })
            .catch(() => {});
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
            <SafeAreaView testID="account-import-label-step" style={[AppStyles.container]}>
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
                        inputStyle={styles.inputText}
                        onChangeText={l => this.setState({ label: l })}
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
