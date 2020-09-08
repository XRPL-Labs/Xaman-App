/**
 * Generate Account/ConfirmSeed Screen
 */

import React, { Component } from 'react';
import { isEqual } from 'lodash';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { Prompt } from '@common/helpers/interface';
import Localize from '@locale';
// components
import { Button, Footer } from '@components/General';
import { SecretNumberInput } from '@components/Modules';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    currentRow: number;
    allFilled: boolean;
}

/* Component ==================================================================== */
class ConfirmStep extends Component<Props, State> {
    secretNumberInput: SecretNumberInput;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            currentRow: 0,
            allFilled: false,
        };
    }

    goNext = () => {
        const { generatedAccount, goNext } = this.context;

        const secretNumber = this.secretNumberInput.getNumbers();

        if (__DEV__) {
            goNext('ViewPublicKey');
            return;
        }

        if (isEqual(generatedAccount.secret.secretNumbers, secretNumber)) {
            goNext('ViewPublicKey');
        } else {
            Alert.alert('Invalid', Localize.t('account.invalidSecretNumber'));
        }
    };

    goBack = () => {
        const { goBack } = this.context;

        Prompt(
            Localize.t('global.pleaseNote'),
            Localize.t('account.goBackClearTheInput'),
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

    validateRow = (row: number, numbers: string) => {
        const { generatedAccount } = this.context;
        return isEqual(generatedAccount.secret.secretNumbers[row], numbers);
    };

    render() {
        const { allFilled, currentRow } = this.state;
        const abcdefgh = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        return (
            <SafeAreaView testID="account-generate-confirm-private-view" style={[AppStyles.container]}>
                {currentRow < 8 ? (
                    <>
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('account.confirmNumbersOfRow', {
                                row: abcdefgh[currentRow],
                            })}
                        </Text>
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('account.pleaseRepeatTheNumbers')}
                        </Text>
                    </>
                ) : (
                    <>
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('account.allDoneYouCanGoToNextStepNow')}
                        </Text>
                    </>
                )}

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={(r) => {
                            this.secretNumberInput = r;
                        }}
                        onAllFilled={(filled) => {
                            this.setState({
                                allFilled: filled,
                            });
                        }}
                        onRowChanged={(row) => {
                            this.setState({
                                currentRow: row,
                            });
                        }}
                        validateRow={this.validateRow}
                    />
                </View>

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
                            isDisabled={!__DEV__ && !allFilled}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                            textStyle={AppStyles.strong}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ConfirmStep;
