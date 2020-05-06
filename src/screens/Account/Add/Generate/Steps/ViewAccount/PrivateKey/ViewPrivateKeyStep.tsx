/**
 * Generate Account/View Private key Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

// components
import { Button, Footer, SecretNumberInput } from '@components';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { GenerateSteps, AccountObject } from '@screens/Account/Add/Generate/types';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: GenerateSteps, settings?: AccountObject) => void;
    goNext: (step?: GenerateSteps, settings?: AccountObject) => void;
}

export interface State {
    currentRow: number;
    secretNumbers: string[];
}

/* Constants ==================================================================== */
const ROWS = 8;

/* Component ==================================================================== */
class ViewPrivateKeyStep extends Component<Props, State> {
    secretNumberInput: SecretNumberInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            currentRow: 0,
            secretNumbers: props.account.generatedAccount.secret.secretNumbers,
        };
    }

    goBack = () => {
        const { goBack } = this.props;

        const { currentRow } = this.state;

        if (currentRow > 0) {
            this.setState({
                currentRow: currentRow - 1,
            });
        } else {
            goBack();
        }
    };

    goNext = () => {
        const { goNext } = this.props;

        const { currentRow } = this.state;

        if (currentRow < ROWS - 1) {
            this.setState({
                currentRow: currentRow + 1,
            });
        } else {
            goNext('ConfirmSeed');
        }
    };

    render() {
        const { currentRow, secretNumbers } = this.state;

        const abcdefgh = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        return (
            <SafeAreaView testID="account-generate-view-private" style={[AppStyles.pageContainerFull]}>
                <Text style={[AppStyles.p, AppStyles.bold]}>
                    {Localize.t('account.secretNumbersOfRow', { row: abcdefgh[currentRow] })}
                </Text>
                <Text style={[AppStyles.p]}>{Localize.t('account.pleaseWriteDownAllNumbers')}</Text>

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={r => {
                            this.secretNumberInput = r;
                        }}
                        currentRow={currentRow}
                        secretNumbers={secretNumbers}
                        readonly
                    />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex8]}>
                        <Button
                            secondary
                            textStyle={AppStyles.strong}
                            icon="IconChevronLeft"
                            label={currentRow === 0 ? Localize.t('global.back') : Localize.t('global.previous')}
                            onPress={this.goBack}
                        />
                    </View>

                    <View style={AppStyles.flex1} />

                    <View style={[AppStyles.flex8]}>
                        <Button
                            testID="next-button"
                            secondary={currentRow !== ROWS - 1}
                            textStyle={AppStyles.strong}
                            label={currentRow !== ROWS - 1 ? Localize.t('global.next') : Localize.t('global.done')}
                            icon={currentRow !== ROWS - 1 ? 'IconChevronRight' : null}
                            iconPosition="right"
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ViewPrivateKeyStep;
