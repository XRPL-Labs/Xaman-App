/**
 * Import Account/Mnemonic Screen
 */

import { get, set } from 'lodash';
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
    TouchableOpacity,
    KeyboardEvent,
} from 'react-native';
import { derive } from 'xrpl-accountlib';

import Localize from '@locale';
// components
import { PasswordInput, Button, Spacer, Switch, Footer } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    words: string[];
    length: number;
    usePassphrase: boolean;
    passphrase: string;
    activeRow: number;
    keyboardHeight: number;
}

/* Component ==================================================================== */
class EnterMnemonicStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    scrollView: ScrollView;
    inputs: TextInput[];
    scrollToBottomY: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            words: Array(16),
            length: 16,
            usePassphrase: false,
            passphrase: '',
            activeRow: -1,
            keyboardHeight: 0,
        };

        this.inputs = [];
    }

    componentDidMount() {
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
        const { goNext, setImportedAccount } = this.context;
        const { words, usePassphrase, passphrase } = this.state;

        if (words.filter(Boolean).length < 6) {
            Alert.alert('Error', Localize.t('account.pleaseEnterAllWords'));
            return;
        }

        let options = {};

        if (usePassphrase && passphrase) {
            options = Object.assign(options, { passphrase });
        }

        try {
            const mnemonic = words.filter(Boolean).join(' ');
            const account = derive.mnemonic(mnemonic, options);

            // set imported account
            setImportedAccount(account, () => {
                // go to next step
                goNext('ConfirmPublicKey');
            });
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
                <TouchableOpacity
                    key={`row.${i}`}
                    style={[styles.inputRow, isActive && styles.inputRowActive]}
                    onPress={() => {
                        if (this.inputs[i]) {
                            this.inputs[i].focus();
                        }
                    }}
                >
                    <Text style={[styles.label, isActive && styles.labelActive]}>#{i + 1}</Text>
                    <TextInput
                        ref={(r) => {
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
                        onChangeText={(v) => {
                            this.setValue(i, v);
                        }}
                        onFocus={() => {
                            this.setState({
                                activeRow: i,
                            });
                        }}
                    />
                </TouchableOpacity>,
            );
        }
        return rows;
    };

    renderPassphrase = () => {
        const { usePassphrase } = this.state;

        return (
            <View style={[AppStyles.flex1, AppStyles.paddingVerticalSml]}>
                <View style={AppStyles.hr} />

                <View style={[AppStyles.row, AppStyles.paddingVerticalSml]}>
                    <View style={[AppStyles.leftAligned]}>
                        <Switch
                            onChange={(enabled) => {
                                this.setState({ usePassphrase: enabled });

                                setTimeout(() => {
                                    if (this.scrollView) {
                                        this.scrollView.scrollTo({ y: this.scrollToBottomY });
                                    }
                                }, 100);
                            }}
                            checked={usePassphrase}
                        />
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.centerContent]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>
                            {Localize.t('account.useMnemonicPassphrase')}
                        </Text>
                    </View>
                </View>

                {usePassphrase && (
                    <PasswordInput
                        onChange={(pass) => {
                            this.setState({
                                passphrase: pass,
                            });
                        }}
                        placeholder={Localize.t('global.password')}
                    />
                )}
            </View>
        );
    };

    render() {
        const { goBack } = this.context;
        const { length, keyboardHeight } = this.state;

        return (
            <SafeAreaView testID="account-import-enter-mnemonic" style={[AppStyles.container]}>
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
                    ref={(r) => {
                        this.scrollView = r;
                    }}
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    contentContainerStyle={[AppStyles.paddingHorizontal]}
                    contentInset={{ bottom: keyboardHeight, top: 0 }}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        this.scrollToBottomY = contentHeight;
                    }}
                >
                    {this.renderRows()}
                    {this.renderPassphrase()}
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
                        <Button textStyle={AppStyles.strong} label={Localize.t('global.next')} onPress={this.goNext} />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterMnemonicStep;
