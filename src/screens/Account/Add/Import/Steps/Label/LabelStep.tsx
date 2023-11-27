/**
 * import Account/Label Screen
 */

import { isEmpty, get } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { AppConfig } from '@common/constants';

import { getAccountName } from '@common/helpers/resolver';

import { Button, TextInput, Spacer, KeyboardAwareScrollView, Footer } from '@components/General';

import { AccountTypes } from '@store/types';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    label: string;
    isLoading: boolean;
}

/* Component ==================================================================== */
class LabelStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            label: '',
        };
    }

    componentDidMount() {
        const { account } = this.context;

        if (account.type === AccountTypes.Tangem) {
            this.setState({
                label: '💳 ',
            });
        }

        getAccountName(account.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    const name = get(res, 'name');

                    if (name) {
                        if (account.type === AccountTypes.Tangem) {
                            if (name.starsWith('💳')) {
                                this.setState({
                                    label: res.name,
                                });
                            } else {
                                this.setState({
                                    label: `💳 ${res.name}`,
                                });
                            }
                        } else {
                            this.setState({
                                label: res.name,
                            });
                        }
                    }
                }
            })
            .catch(() => {})
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    goNext = () => {
        const { goNext, setLabel } = this.context;
        const { label } = this.state;

        if (label.length > AppConfig.accountLabelLimit) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountLabelCannotBeMoreThan'));
            return;
        }

        // set account label
        setLabel(label.trim(), () => {
            // go next
            goNext('FinishStep');
        });
    };

    onLabelTextChange = (label: string) => {
        this.setState({
            label: label.replace(/\n/g, '').substring(0, AppConfig.accountLabelLimit),
        });
    };

    render() {
        const { goBack } = this.context;
        const { label, isLoading } = this.state;

        return (
            <SafeAreaView testID="account-import-label-view" style={AppStyles.container}>
                <KeyboardAwareScrollView style={AppStyles.flex1} contentContainerStyle={AppStyles.paddingHorizontal}>
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.pleaseChooseAccountLabel')}
                    </Text>

                    <Spacer size={50} />

                    <TextInput
                        testID="label-input"
                        maxLength={AppConfig.accountLabelLimit}
                        placeholder={Localize.t('account.accountLabel')}
                        value={label}
                        inputStyle={styles.inputText}
                        onChangeText={this.onLabelTextChange}
                        autoCapitalize="sentences"
                        isLoading={isLoading}
                        autoFocus
                    />
                </KeyboardAwareScrollView>
                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                            light
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            isDisabled={!label.trim()}
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
export default LabelStep;
