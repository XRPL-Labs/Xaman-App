/**
 * Import Account/SecretNumbers Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { derive } from 'xrpl-accountlib';
import { Utils } from 'xrpl-secret-numbers';

import { VibrateHapticFeedback } from '@common/helpers/interface';

import Localize from '@locale';
// components
import { Button, Footer } from '@components/General';
import { SecretNumberInput } from '@components/Modules';

// style
import { AppStyles } from '@theme';
import styles from '../../../Generate/Steps/ConfirmSeed/styles';
import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    currentRow: number;
    allFilled: boolean;
}

/* Component ==================================================================== */
class EnterSecretNumbers extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private secretNumberInputRef: React.RefObject<SecretNumberInput>;
    private secretNumbers: string[];

    constructor(props: Props) {
        super(props);

        this.state = {
            allFilled: false,
            currentRow: 0,
        };

        this.secretNumberInputRef = React.createRef();
        this.secretNumbers = ['','','','','','','',''];
    }

    goNext = () => {
        const { goNext, setImportedAccount, importOfflineSecretNumber } = this.context;

        try {
            // double check, this should never happen
            if (!this.secretNumbers || !Array.isArray(this.secretNumbers)) {
                Alert.alert(Localize.t('global.error'), 'No secret number provided!');
                return;
            }

            const account = derive.secretNumbers(this.secretNumbers, importOfflineSecretNumber);

            // set imported account
            setImportedAccount(account, () => {
                // go to next step
                goNext('ConfirmPublicKey');
            });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidSecretNumber'));
        }
    };

    clearPin = () => {
        this.setState({ allFilled: false });
        this.secretNumberInputRef.current?.clearPin();
    };

    validateRow = (numbers: string) => {
        const { currentRow } = this.state;

        const validates = !!Utils.checkChecksum(currentRow, numbers);
        if (!validates) {
            VibrateHapticFeedback('notificationError');
            Alert.alert(
                'Invalid', 
                `${Localize.t('account.invalidSecretNumber')}\n\n${Localize.t('account.confirmNumbersOfRow', { row: 'abcdefgh'[currentRow].toUpperCase() })}`,
                [ { onPress: this.clearPin } ],
            );
        } else {
            setTimeout(() => {
                this.clearPin();
                this.secretNumbers[currentRow] = numbers;
                if (currentRow < 7) {
                    this.setState({
                        currentRow: currentRow + 1,
                    });
                } else {
                    // Done
                    this.goNext();
                }
            }, 150);
        }

        return validates;
    };


    onAllFilled = (filled: boolean) => {
        this.setState({
            allFilled: filled,
        });
    };

    render() {
        const { allFilled, currentRow } = this.state;
        const { goBack, importOfflineSecretNumber } = this.context;

        return (
            <SafeAreaView testID="account-import-enter-secretNumbers" style={AppStyles.container}>
                <Text
                    style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontalSml]}
                >
                    {Localize.t('account.pleaseEnterYourSecretNumber')}
                </Text>
                <View style={[
                    AppStyles.marginTop,
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
                            {'abcdefgh'?.[currentRow]?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={this.secretNumberInputRef}
                        validateRow={this.validateRow}
                        checksum={!importOfflineSecretNumber}
                    />
                </View>

                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
                            isDisabled={!allFilled}
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
export default EnterSecretNumbers;
