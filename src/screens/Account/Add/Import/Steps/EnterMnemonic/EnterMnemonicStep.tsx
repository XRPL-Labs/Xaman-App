/**
 * Import Account/Mnemonic Screen
 */

// TODO: refactor this code for better ref handling and anon functions

import { get, set, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { SafeAreaView, View, Text, TextInput, Alert, Platform, TouchableOpacity } from 'react-native';

import { StringType, XrplSecret } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
import { curveChoiceButtonLabel, MnemonicAlgorithm, pickMnemonicImport } from '@common/utils/mnemonicImport';

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

import Localize from '@locale';

import { ScanModalProps } from '@screens/Modal/Scan';

import LedgerService from '@services/LedgerService';
import { CoreRepository } from '@store/repositories';

import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

const DEBUG_ED25519_MNEMONIC = [
    'lamp',
    'elevator',
    'orchard',
    'music',
    'glare',
    'night',
    'upper',
    'race',
    'mixture',
    'bullet',
    'property',
    'nasty',
    'agent',
    'sword',
    'blind',
    'dynamic',
    'gossip',
    'life',
    'series',
    'shrug',
    'day',
    'ice',
    'control',
    'reunion',
];

/* types ==================================================================== */
export interface Props {}

export interface State {
    words: string[];
    length: number;
    usePassphrase: boolean;
    useAlternativePath: boolean;
    useCurve: boolean;
    curve: MnemonicAlgorithm;
    passphrase: string;
    derivationPath: any;
    activeRow: number;
    isLoading: boolean;
}

/* Component ==================================================================== */
class EnterMnemonicStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private scrollViewRef: React.RefObject<KeyboardAwareScrollView>;
    private inputs: Array<TextInput | null>;
    private derivationPathInputRef: React.RefObject<DerivationPathInput>;
    private scrollToBottomY: number;

    constructor(props: Props) {
        super(props);

        this.state = {
            words: Array(16),
            length: 16,
            usePassphrase: false,
            useAlternativePath: false,
            useCurve: false,
            curve: 'secp256k1',
            passphrase: '',
            derivationPath: undefined,
            activeRow: -1,
            isLoading: false,
        };

        this.scrollViewRef = React.createRef();
        this.derivationPathInputRef = React.createRef();

        this.scrollToBottomY = 0;

        // TODO: use React.createRef instead
        this.inputs = [];
    }

    canPrefillDebugEdMnemonic = (overrides: Partial<State> = {}) => {
        const { length, words, useCurve, curve } = { ...this.state, ...overrides };
        return (
            __DEV__ &&
            CoreRepository.isDeveloperModeEnabled() &&
            length === 24 &&
            useCurve &&
            curve === 'ed25519' &&
            words.filter(Boolean).length === 0
        );
    };

    debugEdMnemonicWords = () => DEBUG_ED25519_MNEMONIC.slice();

    finishImport = (account: any) => {
        const { goNext, setImportedAccount } = this.context;

        setImportedAccount(account, () => {
            goNext('ConfirmPublicKey');
        });
    };

    goNext = async () => {
        let { words, usePassphrase, passphrase, useAlternativePath, derivationPath, useCurve, curve } = this.state;

        if (this.canPrefillDebugEdMnemonic()) {
            words = this.debugEdMnemonicWords();
            this.setState({ words });
        }

        if (words.filter(Boolean).length < 6) {
            Alert.alert('Error', Localize.t('account.pleaseEnterAllWords'));
            return;
        }

        this.setState({
            isLoading: true,
        });

        const deriveOptions: {
            passphrase?: string;
            accountPath?: string;
            changePath?: string;
            addressIndex?: string;
        } = {};

        if (usePassphrase && passphrase) {
            deriveOptions.passphrase = passphrase;
        }

        if (useAlternativePath && derivationPath) {
            Object.assign(deriveOptions, derivationPath);
        }

        try {
            const mnemonic = words.filter(Boolean).join(' ');
            const picked = await pickMnemonicImport({
                mnemonic,
                deriveOptions,
                explicitAlgorithm: useCurve ? curve : undefined,
                getAccountInfo: (address) => LedgerService.getAccountInfo(address),
            });

            if (picked.status === 'conflict' || picked.status === 'inconclusive') {
                Prompt(
                    Localize.t('account.chooseMnemonicCurve'),
                    `${Localize.t(
                        picked.status === 'conflict'
                            ? 'account.bothMnemonicCurvesActivated'
                            : 'account.curveDetectionInconclusive',
                    )}\n\n${Localize.t('account.curveChoiceAddresses', {
                        secp: picked.secp.address,
                        ed: picked.ed.address,
                    })}`,
                    [
                        {
                            text: curveChoiceButtonLabel(
                                Localize.t('account.mnemonicCurveSecp'),
                                picked.secp.address,
                            ),
                            onPress: () => this.finishImport(picked.secp),
                        },
                        {
                            text: curveChoiceButtonLabel(Localize.t('account.mnemonicCurveEd'), picked.ed.address),
                            onPress: () => this.finishImport(picked.ed),
                        },
                        {
                            text: Localize.t('global.cancel'),
                            style: 'cancel',
                            onPress: () => {
                                this.setState({
                                    isLoading: false,
                                });
                            },
                        },
                    ],
                );
                return;
            }

            this.finishImport(picked.account);
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

        let words: any[];

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
        Navigator.showModal<ScanModalProps>(AppScreens.Modal.Scan, {
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
            const nextWords =
                newLength > length ? words.concat(Array(newLength - length)) : words.slice(0, newLength);
            const nextState = { words: nextWords, length: newLength };
            if (this.canPrefillDebugEdMnemonic(nextState)) {
                nextState.words = this.debugEdMnemonicWords();
            }
            this.setState(nextState);
        }
    };

    onDerivationPathChange = (path: any) => {
        this.setState({
            derivationPath: path,
        });
    };

    scrollToBottom = () => {
        setTimeout(() => {
            this.scrollViewRef?.current?.scrollTo(this.scrollToBottomY);
        }, 100);
    };

    onContentSizeChange = (contentWidth: number, contentHeight: number) => {
        this.scrollToBottomY = contentHeight;
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
                        this.inputs[i]?.focus();
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
                                        this.inputs[i + 1]?.focus();
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
            <View style={styles.optionSection}>
                <View style={AppStyles.hr} />
                <View style={styles.optionRow}>
                    <View style={AppStyles.leftAligned}>
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
                        inputWrapperStyle={AppStyles.marginBottomSml}
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
            <View style={styles.optionSection}>
                <View style={AppStyles.hr} />
                <View style={styles.optionRow}>
                    <View style={AppStyles.leftAligned}>
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
                        ref={this.derivationPathInputRef}
                        onChange={this.onDerivationPathChange}
                    />
                )}
            </View>
        );
    };

    renderCurve = () => {
        const { useCurve, curve } = this.state;

        return (
            <View style={styles.optionSection}>
                <View style={AppStyles.hr} />
                <View style={styles.optionRow}>
                    <View style={AppStyles.leftAligned}>
                        <Switch
                            testID="choose-curve-switch"
                            onChange={(enabled) => {
                                const next = { useCurve: enabled };
                                this.setState(
                                    {
                                        useCurve: enabled,
                                        words:
                                            enabled && this.canPrefillDebugEdMnemonic(next)
                                                ? this.debugEdMnemonicWords()
                                                : this.state.words,
                                    },
                                    this.scrollToBottom,
                                );
                            }}
                            checked={useCurve}
                        />
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.centerContent]}>
                        <Text style={[AppStyles.subtext, AppStyles.bold]}>
                            {Localize.t('account.chooseMnemonicCurve')}
                        </Text>
                    </View>
                </View>

                {useCurve && (
                    <View style={AppStyles.row}>
                        <Button
                            testID="curve-secp256k1-button"
                            light
                            onPress={() => {
                                this.setState({ curve: 'secp256k1' });
                            }}
                            roundedSmall
                            icon={curve === 'secp256k1' ? 'IconCheck' : undefined}
                            iconSize={14}
                            style={[styles.optionsButton, curve === 'secp256k1' ? styles.optionsButtonSelected : {}]}
                            textStyle={[
                                styles.optionsButtonText,
                                curve === 'secp256k1' && styles.optionsButtonSelectedText,
                            ]}
                            iconStyle={curve === 'secp256k1' ? styles.optionsButtonSelectedIcon : undefined}
                            label={Localize.t('account.mnemonicCurveSecp')}
                        />
                        <Button
                            testID="curve-ed25519-button"
                            light
                            onPress={() => {
                                const next = { curve: 'ed25519' as MnemonicAlgorithm };
                                this.setState({
                                    ...next,
                                    words: this.canPrefillDebugEdMnemonic(next)
                                        ? this.debugEdMnemonicWords()
                                        : this.state.words,
                                });
                            }}
                            roundedSmall
                            icon={curve === 'ed25519' ? 'IconCheck' : undefined}
                            iconSize={14}
                            style={[styles.optionsButton, curve === 'ed25519' ? styles.optionsButtonSelected : {}]}
                            textStyle={[
                                styles.optionsButtonText,
                                curve === 'ed25519' && styles.optionsButtonSelectedText,
                            ]}
                            iconStyle={curve === 'ed25519' ? styles.optionsButtonSelectedIcon : undefined}
                            label={Localize.t('account.mnemonicCurveEd')}
                        />
                    </View>
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
                        style={[styles.optionsButton, length === 12 ? styles.optionsButtonSelected : {}]}
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
                        style={[styles.optionsButton, length === 16 ? styles.optionsButtonSelected : {}]}
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
                        style={[styles.optionsButton, length === 24 ? styles.optionsButtonSelected : {}]}
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
                    ref={this.scrollViewRef}
                    testID="mnemonic-words-scroll"
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    contentContainerStyle={[AppStyles.paddingHorizontal, styles.mnemonicScrollContent]}
                    onContentSizeChange={this.onContentSizeChange}
                >
                    {this.renderRows()}
                    {this.renderPassphrase()}
                    {this.renderDerivationPath()}
                    {this.renderCurve()}
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
                    <View style={AppStyles.flex5}>
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
