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

import moment from 'moment-timezone';

import styles from './styles';

/* Types ==================================================================== */

interface Props {
    codeLength: number;
    autoFocus?: boolean;
    checkStrength?: boolean;
    onFinish?: (code: string, isStrong?: boolean) => void;
    onEdit?: (pin: string) => void;
}

interface State {
    code: string;
}

/* Component ==================================================================== */
class PinInput extends Component<Props, State> {
    private readonly textInputRef: React.RefObject<TextInput>;

    public static defaultProps = {
        codeLength: 4,
        autoFocus: true,
        checkStrength: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            code: '',
        };

        this.textInputRef = React.createRef();
    }

    public blur = () => {
        setTimeout(() => {
            if (this.textInputRef?.current) {
                this.textInputRef?.current.blur();
            }
        }, 100);
    };

    public focus = () => {
        // this is a quick fix for android bug
        // Android: Calling TextInput instance's focus() after keyboard
        // is closed via back button/submit doesn't bring up keyboard
        if (this.textInputRef?.current) {
            this.textInputRef?.current.blur();
        }

        setTimeout(() => {
            if (this.textInputRef?.current) {
                this.textInputRef?.current.focus();
            }
        }, 100);
    };

    public clean = () => {
        this.setState({
            code: '',
        });
    };

    isStrong = (code: string): boolean => {
        const mostUsedPin = [
            '123456',
            '123123',
            '111111',
            '121212',
            '123321',
            '666666',
            '000000',
            '654321',
            '696969',
            '112233',
            '159753',
            '292513',
            '131313',
            '123654',
            '222222',
            '789456',
            '999999',
            '101010',
            '777777',
            '007007',
            '65432',
            '555555',
            '987654',
            '888888',
            '456789',
            '333333',
            '246810',
            '159357',
            '232323',
            '252525',
            '147258',
            '147852',
        ];

        // pin code is in frequently used codes
        if (mostUsedPin.indexOf(code) > -1) {
            return false;
        }

        // at least 3 unique digits.
        let uniqueDigits = code.length;
        for (let i = 0; i < code.length; i++) {
            for (let j = i + 1; j < code.length; j++) {
                if (code[i] === code[j]) {
                    uniqueDigits -= 1;
                }
            }
        }
        if (uniqueDigits < 3) {
            return false;
        }

        // start searching for pattern for where each digit can be start of the pattern
        let totalSequence = 0;
        let index = 0;
        while (index < code.length) {
            let following = index + 2;
            let sequence = 0;
            let repeating = 0;

            const shift = Number(code[index + 1]) - Number(code[index]);

            while (following < code.length) {
                if (Number(code[following]) - Number(code[following - 1]) === shift) {
                    sequence += sequence === 0 ? 3 : 1;
                } else if (code[following] === code[following - 1]) {
                    repeating++;
                } else {
                    break;
                }
                following++;
            }
            if (sequence !== 0) {
                sequence += repeating;
            }
            if (sequence >= 3) {
                index = following + 1;
                totalSequence += sequence;
            } else {
                index++;
            }
        }
        if (totalSequence >= 3) {
            return false;
        }

        // check if pin is reference as date
        // if pin could be date with year (like 121091 that could be 12th of October or 10th of December 1991)
        const possibleDate = moment(code, 'DDMMYY').isValid() || moment(code, 'MMDDYY').isValid();
        if (possibleDate) {
            return false;
        }

        return true;
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

    handleEdit = (str: string) => {
        const { code } = this.state;
        const { codeLength, checkStrength, onFinish } = this.props;

        // nothing changed
        if (str === code) {
            return;
        }

        // remove any non digits
        const cleanCode = str.replace(/[^0-9]/g, '');

        if (!cleanCode) {
            this.setPinCode('');
            return;
        }

        // limit the input for not more than the requested code length
        if (cleanCode.length <= codeLength) {
            this.setPinCode(cleanCode);
        }

        // User filling the last pin ?
        if (cleanCode.length === codeLength) {
            if (this.textInputRef?.current) {
                this.textInputRef?.current.blur();
            }

            if (onFinish) {
                onFinish(cleanCode, checkStrength ? this.isStrong(cleanCode) : undefined);
            }
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
                    onPress={this.focus}
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
            <View style={styles.container}>
                <TextInput
                    ref={this.textInputRef}
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
                <View style={styles.containerPin}>{pins}</View>
            </View>
        );
    }
}

export default PinInput;
