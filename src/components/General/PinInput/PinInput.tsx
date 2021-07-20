/* eslint-disable no-trailing-spaces */

import React, { Component } from 'react';
import {
    TextInput,
    View,
    Text,
    Platform,
    TouchableOpacity,
    NativeSyntheticEvent,
    TextInputKeyPressEventData,
} from 'react-native';

import styles from './styles';

/* Types ==================================================================== */

interface Props {
    codeLength: number;
    autoFocus?: boolean;
    onFinish?: (code: string) => void;
    onEdit?: (pin: string) => void;
}

interface State {
    code: string;
}
/* Component ==================================================================== */
class PinInput extends Component<Props, State> {
    private textInput: TextInput = undefined;

    constructor(props: Props) {
        super(props);

        this.state = {
            code: '',
        };
    }

    public static defaultProps = {
        codeLength: 4,
        autoFocus: true,
    };

    public blur = () => {
        setTimeout(() => {
            if (this.textInput) {
                this.textInput.blur();
            }
        }, 100);
    };

    public focus = () => {
        // this is a quick fix for android bug
        // Android: Calling TextInput instance's focus() after keyboard
        // is closed via back button/submit doesn't bring up keyboard
        this.textInput.blur();
        setTimeout(() => {
            if (this.textInput) {
                this.textInput.focus();
            }
        }, 100);
    };

    public clean = () => {
        this.setState({
            code: '',
        });
    };

    setPinCode = (newCode: string) => {
        const { onEdit } = this.props;

        if (onEdit) {
            onEdit(newCode);
        }

        this.setState({
            code: newCode,
        });
    };

    onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        const { code } = this.state;

        if (e.nativeEvent.key === 'Backspace' && Platform.OS === 'android') {
            const arrayCode = code.split('');
            arrayCode.pop();
            this.setPinCode(arrayCode.join(''));
        }
    };

    handleEdit = (code: string) => {
        const { codeLength, onFinish } = this.props;

        // remove any non digits
        const cleanCode = code.replace(/[^0-9]/g, '');

        if (cleanCode) {
            // limit the input for not more than the requested code length
            if (cleanCode.length <= codeLength) {
                this.setPinCode(cleanCode);
            }
            // User filling the last pin ?
            if (cleanCode.length === codeLength) {
                this.textInput.blur();

                if (onFinish) {
                    onFinish(cleanCode);
                }
            }
        } else {
            this.setPinCode('');
        }
    };

    render() {
        const { codeLength, autoFocus } = this.props;
        const { code } = this.state;

        const pins = [];

        for (let index = 0; index < codeLength; index++) {
            pins.push(
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                        this.focus();
                    }}
                    key={index}
                    style={[styles.pinInput, code.length === index && styles.pinInputActive]}
                >
                    <Text adjustsFontSizeToFit style={styles.pinText}>
                        {code.length > index ? '•' : ''}
                    </Text>
                </TouchableOpacity>,
            );
        }

        let props = {};

        // ios
        if (Platform.OS === 'ios') {
            props = { display: 'none' };
        } else {
            // android
            props = { style: styles.hiddenInput };
        }

        return (
            <View style={[styles.container]}>
                <TextInput
                    ref={(r) => {
                        this.textInput = r;
                    }}
                    testID="pin-input"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    onKeyPress={this.onKeyPress}
                    onChangeText={this.handleEdit}
                    maxLength={codeLength}
                    autoFocus={autoFocus}
                    value={code}
                    autoCorrect={false}
                    spellCheck={false}
                    disableFullscreenUI
                    secureTextEntry
                    caretHidden
                    // eslint-disable-next-line
                    {...props}
                />
                <View style={[styles.containerPin]}>{pins}</View>
            </View>
        );
    }
}

export default PinInput;
