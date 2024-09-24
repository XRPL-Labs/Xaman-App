/**
 * Import Account/Mnemonic Screen
 */

// TODO: refactor this code for better ref handling and anon functions

import { get, set, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { SafeAreaView, View, Text, TextInput, Alert, Platform, TouchableOpacity } from 'react-native';

import { derive } from 'xrpl-accountlib';

import { StringType, XrplSecret } from 'xumm-string-decode';

import Localize from '@locale';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import {
    KeyboardAwareScrollView,
    PasswordInput,
    DerivationPathInput,
    Button,
    Spacer,
    Switch,
    Footer,
} from '@components/General';

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
    useAlternativePath: boolean;
    passphrase: string;
    derivationPath: any;
    activeRow: number;
    isLoading: boolean;
}

/* Component ==================================================================== */
class EnterMnemonicStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    scrollView: KeyboardAwareScrollView;
    inputs: TextInput[];
    derivationPathInput: DerivationPathInput;
    scrollToBottomY: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            words: Array(16),
            length: 16,
            usePassphrase: false,
            useAlternativePath: false,
            passphrase: '',
            derivationPath: undefined,
            activeRow: -1,
            isLoading: false,
        };

        this.inputs = [];
    }

    goNext = () => {
        const { goNext, setImportedAccount } = this.context;
        const { words, usePassphrase, passphrase, useAlternativePath, derivationPath } = this.state;

        if (words.filter(Boolean).length < 6) {
            Alert.alert('Error', Localize.t('account.pleaseEnterAllWords'));
            return;
        }

        this.setState({
            isLoading: true,
        });

        let options = {};

        if (usePassphrase && passphrase) {
            options = Object.assign(options, { passphrase });
        }

        if (useAlternativePath && derivationPath) {
            options = Object.assign(options, derivationPath);
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
            this.setState({
                isLoading: false,
            });
            Alert.alert('Error', Localize.t('account.invalidMnemonic'));
        }
    };

    onScannerRead = (decoded: XrplSecret) => {
        const { mnemonic } = decoded;

        if (!mnemonic) {
            return;
        }

        let words = [];

        // first try space
        words = mnemonic.split(' ');

        // if not try line break
        if (isEmpty(words)) {
            words = mnemonic.split('\n');
        }

        if (!isEmpty(words)) {
            let length = 12;
            if (words.length > 12 && words.length < 17) {
                length = 16;
            }

            if (words.length > 16) {
                length = 24;
            }

            this.setState({
                words,
                length,
            });
        }
    };

    showScanner = () => {
        Navigator.showModal(AppScreens.Modal.Scan, {
            onRead: this.onScannerRead,
            type: StringType.XrplSecret,
        });
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

    onDerivationPathChange = (path: any) => {
        this.setState({
            derivationPath: path,
        });
    };

    scrollToBottom = () => {
        setTimeout(() => {
            if (this.scrollView) {
                this.scrollView.scrollTo(this.scrollToBottomY);
            }
        }, 100);
    };

    renderRows = () => {
        const { words, length, activeRow } = this.state;

        const rows = [];

        for (let i = 0; i < length; i++) {
            const isActive = activeRow === i;

            let value = get(words, `[${i}]`, '');

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
                        testID={`word-${i}-input`}
                        ref={(r) => {
                            this.inputs[i] = r;
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType={Platform.OS === 'android' ? 'visible-password' : 'default'}
                        value={value}
                        style={[styles.input, isActive && styles.inputActive]}
                        returnKeyType={i + 1 === length ? 'done' : 'next'}
                        onSubmitEditing={() => {
                            if (i + 1 !== length) {
                                if (this.inputs[i + 1]) {
                                    setTimeout(() => {
                                        this.inputs[i + 1].focus();
                                    }, 200);
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
            <View style={[AppStyles.flex1]}>
                <View style={AppStyles.hr} />
                <View style={[AppStyles.row, AppStyles.paddingVerticalSml]}>
                    <View style={[AppStyles.leftAligned]}>
                        <Switch
                            onChange={(enabled) => {
                                this.setState({ usePassphrase: enabled }, this.scrollToBottom);
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
                        inputWrapperStyle={[AppStyles.marginBottomSml]}
                        onChange={(pass) => {
                            this.setState({
                                passphrase: pass,
                            });
                        }}
                        placeholder={Localize.t('account.mnemonicPassphrase')}
                    />
                )}
            </View>
        );
    };

    renderDerivationPath = () => {
        const { useAlternativePath } = this.state;

        return (
            <View style={[AppStyles.flex1, AppStyles.paddingBottomSml]}>
                <View style={AppStyles.hr} />

                <View style={[AppStyles.row, AppStyles.paddingVerticalSml]}>
                    <View style={[AppStyles.leftAligned]}>
                        <Switch
                            onChange={(enabled) => {
                                this.setState({ useAlternativePath: enabled }, this.scrollToBottom);
                            }}
                            checked={useAlternativePath}
                        />
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.centerContent]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>
                            {Localize.t('account.alternativeDerivationPath')}
                        </Text>
                    </View>
                </View>

                {useAlternativePath && (
                    <DerivationPathInput
                        autoFocus
                        ref={(r) => {
                            this.derivationPathInput = r;
                        }}
                        onChange={this.onDerivationPathChange}
                    />
                )}
            </View>
        );
    };

    render() {
        const { goBack } = this.context;
        const { length, isLoading } = this.state;

        return (
            <SafeAreaView testID="account-import-enter-mnemonic-view" style={AppStyles.container}>
                <Text
                    numberOfLines={1}
                    style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}
                >
                    {Localize.t('account.pleaseEnterYourMnemonic')}
                </Text>

                <Spacer size={10} />

                <Text
                    numberOfLines={1}
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
                        testID="12-words-button"
                        light
                        onPress={() => {
                            this.onLengthChange(12);
                        }}
                        roundedSmall
                        style={[styles.optionsButton, length === 12 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 12 && styles.optionsButtonSelectedText]}
                        label="12"
                    />
                    <Button
                        testID="16-words-button"
                        onPress={() => {
                            this.onLengthChange(16);
                        }}
                        light
                        roundedSmall
                        style={[styles.optionsButton, length === 16 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 16 && styles.optionsButtonSelectedText]}
                        label="16"
                    />
                    <Button
                        testID="24-words-button"
                        onPress={() => {
                            this.onLengthChange(24);
                        }}
                        light
                        roundedSmall
                        style={[styles.optionsButton, length === 24 && styles.optionsButtonSelected]}
                        textStyle={[styles.optionsButtonText, length === 24 && styles.optionsButtonSelectedText]}
                        label="24"
                    />
                </View>

                <View style={[AppStyles.stretchSelf, AppStyles.paddingHorizontal, AppStyles.paddingBottomSml]}>
                    <Button
                        numberOfLines={1}
                        secondary
                        onPress={this.showScanner}
                        roundedSmall
                        label={Localize.t('account.scanFromQR')}
                    />
                </View>

                <KeyboardAwareScrollView
                    ref={(r) => {
                        this.scrollView = r;
                    }}
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    contentContainerStyle={[AppStyles.paddingHorizontal]}
                    onContentSizeChange={(contentWidth, contentHeight) => {
                        this.scrollToBottomY = contentHeight;
                    }}
                >
                    {this.renderRows()}
                    {this.renderPassphrase()}
                    {this.renderDerivationPath()}
                </KeyboardAwareScrollView>

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
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            isLoading={isLoading}
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
