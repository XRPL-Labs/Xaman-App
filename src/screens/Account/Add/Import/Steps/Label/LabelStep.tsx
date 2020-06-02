/**
 * import Account/Label Screen
 */

import { isEmpty, get } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Platform, KeyboardAvoidingView } from 'react-native';

import { getAccountName } from '@common/helpers/resolver';
// components
import { Button, TextInput, Spacer, Footer } from '@components';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    label: string;
}

/* Component ==================================================================== */
class LabelStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            label: '',
        };
    }

    componentDidMount() {
        const { importedAccount } = this.context;

        getAccountName(importedAccount.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    const name = get(res, 'name');

                    if (name) {
                        this.setState({
                            label: res.name,
                        });
                    }
                }
            })
            .catch(() => {});
    }

    goNext = () => {
        const { goNext, setLabel } = this.context;
        const { label } = this.state;

        if (label.length > 16) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountMaxLabelLengthError'));
            return;
        }

        // set account label
        setLabel(label.trim(), () => {
            // go next
            goNext('FinishStep');
        });
    };

    render() {
        const { goBack } = this.context;
        const { label } = this.state;
        return (
            <SafeAreaView testID="account-import-label-step" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseChooseAccountLabel')}
                </Text>

                <Spacer size={50} />
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[AppStyles.contentContainer, AppStyles.flexStart, AppStyles.paddingSml]}
                >
                    <TextInput
                        maxLength={16}
                        placeholder={Localize.t('account.accountLabel')}
                        value={label}
                        inputStyle={styles.inputText}
                        onChangeText={(l) => this.setState({ label: l })}
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
