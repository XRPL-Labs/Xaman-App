/**
 * SecurePinInput
 *
    <SecurePinInput />
 *
 */
import { isNaN } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableHighlight, TouchableWithoutFeedback, Keyboard, TextInput, Platform } from 'react-native';

import { Icon } from '@components';
import { AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    virtualKeyboard: boolean;
    supportBiometric: boolean;
    length: number;
    clearOnFinish: boolean;
    onInputFinish: (pin: string) => void;
    onBiometryPress: () => void;
}

interface State {
    digits: string[];
}

const BUTTONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Y', 0, 'X'];
/* Component ==================================================================== */
class SecurePinInput extends Component<Props, State> {
    currentIndex: number;
    input: TextInput;

    public static defaultProps = {
        virtualKeyboard: false,
        supportBiometric: true,
        length: 6,
        clearOnFinish: false,
        onBiometryPress: () => {},
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            digits: new Array(props.length).fill(''),
        };

        this.currentIndex = 0;
    }

    public focus = () => {
        const { virtualKeyboard } = this.props;
        if (!virtualKeyboard) {
            this.input.focus();
        }
    };

    onDigitInput = (digit: any) => {
        const { digits } = this.state;
        const { length } = this.props;

        if (digit === 'Backspace') {
            if (this.currentIndex === 0) return;

            this.currentIndex -= 1;

            this.setState(prevState => {
                const newDigits = [...prevState.digits];

                if (newDigits[this.currentIndex] === '') {
                    newDigits[this.currentIndex - 1] = '';
                } else {
                    newDigits[this.currentIndex] = '';
                }

                return {
                    digits: [...newDigits],
                };
            });
        }

        if (digit !== 'Backspace' && digit !== 'Enter') {
            if (this.currentIndex === length) return;

            if (isNaN(parseInt(digit, 0))) return;

            if (digits.some(elem => elem === '')) {
                this.setState(prevState => {
                    const newDigits = [...prevState.digits];
                    newDigits[this.currentIndex] = digit;

                    this.currentIndex += 1;

                    // on finish
                    if (this.currentIndex === length) {
                        this.onFinish(newDigits);
                    }

                    return {
                        digits: [...newDigits],
                    };
                });
            }
        }
    };

    getFocus = () => {
        const { digits } = this.state;
        digits.findIndex(value => value === '');
    };

    checkIfFinish = () => {
        const { digits } = this.state;
        digits.every(elem => elem !== '');
    };

    onFinish = (digits: string[]) => {
        const { clearOnFinish, onInputFinish } = this.props;
        Keyboard.dismiss();
        if (onInputFinish) {
            onInputFinish(digits.join(''));
        }

        if (clearOnFinish) setTimeout(() => this.clearInput(), 1000);
    };

    clearInput = () => {
        const { length } = this.props;
        this.setState({
            digits: new Array(length).fill(''),
        });
        this.currentIndex = 0;
    };

    renderNumText = (flag: number) => {
        const { supportBiometric, onBiometryPress } = this.props;

        return BUTTONS.slice(flag, flag + 3).map((item, index) => {
            if (item === 'X') {
                return (
                    <TouchableHighlight
                        underlayColor={AppColors.transparent}
                        style={styles.line}
                        key={index}
                        onPress={() => {
                            this.onDigitInput('Backspace');
                        }}
                        onLongPress={() => {
                            this.clearInput();
                        }}
                    >
                        <Icon name="IconChevronLeft" size={30} />
                    </TouchableHighlight>
                );
            }
            if (item === 'Y') {
                if (supportBiometric) {
                    return (
                        <TouchableHighlight
                            underlayColor={AppColors.transparent}
                            style={styles.line}
                            key={index}
                            onPress={() => {
                                if (onBiometryPress) {
                                    onBiometryPress();
                                }
                            }}
                        >
                            <Icon name="IconFingerprint" size={30} />
                        </TouchableHighlight>
                    );
                }

                return <View style={styles.line} />;
            }
            return (
                <TouchableHighlight
                    underlayColor={AppColors.transparent}
                    style={styles.line}
                    activeOpacity={0.7}
                    key={index}
                    onPress={() => {
                        this.onDigitInput(item);
                    }}
                >
                    <Text style={styles.numText}>{item}</Text>
                </TouchableHighlight>
            );
        });
    };
    renderNum() {
        return BUTTONS.map((item, index) => {
            if (index % 3 === 0) {
                return (
                    <View style={styles.numWrap} key={index}>
                        {this.renderNumText(index)}
                    </View>
                );
            }

            return null;
        });
    }

    render() {
        const { virtualKeyboard } = this.props;
        const { digits } = this.state;

        let props = {};

        // ios
        if (Platform.OS === 'ios') {
            props = { display: 'none' };
        } else {
            // android
            props = { style: styles.hiddenInput };
        }

        return (
            <TouchableWithoutFeedback onPress={this.focus}>
                <View style={[styles.container]}>
                    {!virtualKeyboard && (
                        <TextInput
                            autoCorrect={false}
                            disableFullscreenUI
                            returnKeyType="done"
                            underlineColorAndroid="transparent"
                            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'default'}
                            maxLength={1}
                            onKeyPress={input => {
                                this.onDigitInput(input.nativeEvent.key);
                            }}
                            ref={component => {
                                this.input = component;
                            }}
                            // eslint-disable-next-line
                            {...props}
                        />
                    )}
                    <View style={styles.digits}>
                        {digits.map((value, index) => (
                            <View
                                key={index}
                                style={[styles.pinStyle, digits[index] !== '' ? { ...styles.pinActiveStyle } : {}]}
                            />
                        ))}
                    </View>

                    {virtualKeyboard && <View style={styles.keyboardWrap}>{this.renderNum()}</View>}
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

/* Export Component ==================================================================== */
export default SecurePinInput;
