/**
 * Generate Account/ConfirmSeed Screen
 */

import React, { Component } from 'react';
import { isEqual } from 'lodash';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { VibrateHapticFeedback } from '@common/helpers/interface';
import Localize from '@locale';
// components
import { Button, Footer } from '@components/General';
import { SecretNumberInput } from '@components/Modules';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
import { Navigator } from '@common/helpers/navigator';
/* types ==================================================================== */
export interface Props {}

export interface State {
    currentRow: number;
    allFilled: boolean;
}

/* Component ==================================================================== */
class ConfirmStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private secretNumberInputRef: React.RefObject<SecretNumberInput>;

    constructor(props: Props) {
        super(props);

        this.state = {
            currentRow: 0,
            allFilled: false,
        };

        this.secretNumberInputRef = React.createRef();
    }

    goNext = () => {
        const { currentRow } = this.state;
        const { goNext, degenMode } = this.context;

        VibrateHapticFeedback(
            currentRow < 7
                ? 'impactHeavy'
                : 'notificationSuccess',
        );

        this.clearPin();

        if (currentRow < 8) {
            this.setState({ currentRow: currentRow + 1 });

            if (currentRow === 7) {
                if (degenMode) {
                    // We just confirmed the secret, we're done
                    goNext();
                } else {
                    goNext('ViewPublicKey');
                }
            }
        }
    };

    goBack = () => {
        const { goBack } = this.context;
        const { currentRow } = this.state;

        VibrateHapticFeedback('impactHeavy');

        if (currentRow > 0) {
            this.clearPin();
            this.setState({ currentRow: currentRow - 1 });                
        } else {
            goBack();
        }
    };

    clearPin = () => {
        this.setState({ allFilled: false });
        this.secretNumberInputRef.current?.clearPin();
    };

    validateRow = (numbers: string) => {
        const { currentRow } = this.state;
        const { generatedAccount } = this.context;

        const validates = isEqual(generatedAccount?.secret.secretNumbers![currentRow], numbers);
        if (!validates) {
            VibrateHapticFeedback('notificationError');
            Alert.alert(
                'Invalid', 
                `${Localize.t('account.invalidSecretNumber')}\n\n${Localize.t('account.confirmNumbersOfRow', { row: 'abcdefgh'[currentRow].toUpperCase() })}`,
                [ { onPress: this.clearPin } ],
            );
        } else {
            setTimeout(() => {
                this.goNext();
            }, 150);
        }

        return validates;
    };

    render() {
        const { allFilled, currentRow } = this.state;
        const abcdefgh = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

        return (
            <SafeAreaView testID="account-generate-confirm-private-view" style={AppStyles.container}>
                {currentRow < 8 ? (
                    <>
                        <View style={[
                            styles.letterBlockWapper,
                        ]}>
                            <View
                                style={[
                                    styles.letterBlock,
                                    // AppStyles.centerContent,
                                    // AppStyles.centerAligned,
                                    // rowChecksumCorrect && !readonly && styles.rowStyleInnerGreen,
                                ]}
                            >
                                <Text style={[
                                    styles.letterBlockText,
                                    // styles.RowId,
                                    // rowChecksumCorrect && !readonly && styles.rowStyleInnerGreenText
                                ]}>
                                    {abcdefgh[currentRow]}
                                </Text>
                            </View>
                        </View>
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
                    <Text style={[AppStyles.p, AppStyles.bold]}>
                        {Localize.t('account.allDoneYouCanGoToNextStepNow')}
                    </Text>
                )}

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={this.secretNumberInputRef}
                        validateRow={this.validateRow}
                    />
                </View>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={this.goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            isDisabled={!allFilled}
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
