/**
 * Import Account/Mnemonic Screen
 */

import { get, set, indexOf } from 'lodash';
import React, { Component } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    Alert,
    ScrollView,
    Keyboard,
    Platform,
    KeyboardEvent,
} from 'react-native';
import { derive } from 'xrpl-accountlib';
import { ImportSteps } from '@screens/Account/Add/Import';

import Localize from '@locale';
// components
import { Button, Spacer, Footer } from '@components';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {
    words: string[];
    length: number;
    activeRow: number;
    keyboardHeight: number;
}

/* Component ==================================================================== */
class EnterMnemonicStep extends Component<Props, State> {
    inputs: TextInput[];

    constructor(props: Props) {
        super(props);

        this.state = {
            words: Array(16),
            length: 16,
            activeRow: -1,
            keyboardHeight: 0,
        };

        this.inputs = [];

        if (Platform.OS === 'ios') {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.addListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'ios') {
            Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.removeListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        const keyboardHeight = e.endCoordinates.height;

        this.setState({
            keyboardHeight,
        });
    };

    onKeyboardHide = () => {
        this.setState({ keyboardHeight: 0 });
    };

    goNext = () => {
        const { goNext } = this.props;
        const { words } = this.state;

        if (indexOf(words, undefined) > -1) {
            Alert.alert('Error', Localize.t('account.pleaseEnterAllWords'));
            return;
        }

        try {
            const mnemonic = words.join(' ');
            const account = derive.mnemonic(mnemonic);
            goNext('ConfirmPublicKey', { importedAccount: account });
        } catch (e) {
            Alert.alert('Error', Localize.t('account.invalidMnemonic'));
        }
    };

    setValue = (col: number, value: string) => {
        const { words } = this.state;

        const cleanValue = value.replace(/\s/g, '');

        this.setState({
            words: set(words, `[${col}]`, cleanValue),
        });
    };

    onLengthChange = (newLength: number) => {
        const { length, words } = this.state;

        if (newLength !== length) {
            if (newLength > length) {
                this.setState({
                    words: words.concat(Array(newLength - length)),
                    length: newLength,
                });
            } else {
                this.setState({
                    words: words.slice(0, newLength),
                    length: newLength,
                });
            }
        }
    };

    renderRows = () => {
        const { words, length, activeRow } = this.state;

        const rows = [];

        for (let i = 0; i < length; i++) {
            const isActive = activeRow === i;

            let value = get(words, `[${i}]`, false);

            if (!isActive) {
                const valueLength = value.length;
                value = '';
                for (let y = 0; y < valueLength; y++) {
                    value += '•';
                }
            }

            rows.push(
                <View key={`row.${i}`} style={[styles.inputRow, isActive && styles.inputRowActive]}>
                    <Text style={[styles.label, isActive && styles.labelActive]}>#{i + 1}</Text>
                    <TextInput
                        ref={r => {
                            this.inputs[i] = r;
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        style={[styles.input, isActive && styles.inputActive]}
                        returnKeyType={i + 1 === length ? 'done' : 'next'}
                        onSubmitEditing={() => {
                            if (i + 1 !== length) {
                                if (this.inputs[i + 1]) {
                                    this.inputs[i + 1].focus();
                                }
                            }
                        }}
                        onChangeText={v => {
                            this.setValue(i, v);
                        }}
                        onFocus={() => {
                            this.setState({
                                activeRow: i,
                            });
                        }}
                    />
                </View>,
            );
        }
        return rows;
    };

    render() {
        const { goBack } = this.props;
        const { words, length, keyboardHeight } = this.state;

        return (
            <SafeAreaView
                onResponderRelease={() => Keyboard.dismiss()}
                testID="account-import-enter-mnemonic"
                style={[AppStyles.container]}
            >
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseEnterYourMnemonic')}
                </Text>

                <Spacer size={10} />

                <Text
                    style={[
                        AppStyles.subtext,
                        AppStyles.bold,
                        AppStyles.colorBlue,
                        AppStyles.textCenterAligned,
                        AppStyles.paddingHorizontal,
                    ]}
                >
                    {Localize.t('account.howManyWordsYourMnemonicIs')}
                </Text>

                <Spacer size={7} />

                <View style={[AppStyles.row, AppStyles.paddingHorizontal, AppStyles.paddingBottomSml]}>
                    <Button
                        onPress={() => {
                            this.onLengthChange(12);
                        }}
                        roundedSmall
                        style={[styles.optionsButton, length === 12 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 12 && styles.optionsButtonSelectedText]}
                        label="12"
                    />
                    <Button
                        onPress={() => {
                            this.onLengthChange(16);
                        }}
                        roundedSmall
                        style={[styles.optionsButton, length === 16 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 16 && styles.optionsButtonSelectedText]}
                        label="16"
                    />
                    <Button
                        onPress={() => {
                            this.onLengthChange(24);
                        }}
                        roundedSmall
                        style={[styles.optionsButton, length === 24 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 24 && styles.optionsButtonSelectedText]}
                        label="24"
                    />
                </View>

                <ScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    contentContainerStyle={[AppStyles.paddingHorizontal]}
                    contentInset={{ bottom: keyboardHeight, top: 0 }}
                >
                    {this.renderRows()}
                </ScrollView>

                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
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
                            isDisabled={indexOf(words, undefined) > -1}
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
export default EnterMnemonicStep;
