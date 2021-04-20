import React, { Component, Fragment } from 'react';
import { View, TouchableOpacity, TextInput, Text, ViewStyle, Animated, LayoutChangeEvent } from 'react-native';

import StyleService from '@services/StyleService';
import { Icon } from '@components/General/Icon';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    testID?: string;
    editable?: boolean;
    validate?: boolean;
    minLength?: number;
    placeholder?: string;
    autoFocus?: boolean;
    selectTextOnFocus?: boolean;
    onChange: (password: string, isValid?: boolean) => void;
    inputWrapperStyle?: ViewStyle | ViewStyle[];
    inputStyle?: ViewStyle | ViewStyle[];
}

interface State {
    inputWidth: number;
    hidePassword: boolean;
    score: number;
}

/* Constants ==================================================================== */
const LEVELS = [
    {
        label: Localize.t('global.patheticallyWeak'),
        labelColor: '#ff2900',
        activeBarColor: '#ff2900',
    },
    {
        label: Localize.t('global.extremelyWeak'),
        labelColor: '#ff3e00',
        activeBarColor: '#ff3e00',
    },
    {
        label: Localize.t('global.veryWeak'),
        labelColor: '#ff5400',
        activeBarColor: '#ff5400',
    },
    {
        label: Localize.t('global.weak'),
        labelColor: '#ff6900',
        activeBarColor: '#ff6900',
    },
    {
        label: Localize.t('global.average'),
        labelColor: '#f3d331',
        activeBarColor: '#f3d331',
    },
    {
        label: Localize.t('global.strong'),
        labelColor: '#14eb6e',
        activeBarColor: '#14eb6e',
    },
    {
        label: Localize.t('global.veryStrong'),
        labelColor: '#0af56d',
        activeBarColor: '#0af56d',
    },
    {
        label: Localize.t('global.unbelievablyStrong'),
        labelColor: '#00ff6b',
        activeBarColor: '#00ff6b',
    },
];

const barColor = StyleService.value('$tint');

/* Component ==================================================================== */
export default class PasswordInput extends Component<Props, State> {
    private instance: any;
    private animatedBarWidth: Animated.Value;

    static defaultProps = {
        validate: false,
        minLength: 6,
        editable: true,
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            inputWidth: 0,
            hidePassword: true,
            score: 0,
        };

        this.animatedBarWidth = new Animated.Value(0);
    }

    componentDidMount() {
        const { autoFocus } = this.props;

        if (autoFocus) {
            setTimeout(() => {
                if (this.instance) {
                    this.instance.focus();
                }
            }, 50);
        }
    }

    public focus = () => {
        setTimeout(() => {
            if (this.instance) {
                this.instance.focus();
            }
        }, 50);
    };

    toggleSwitch() {
        const { hidePassword } = this.state;
        this.setState({ hidePassword: !hidePassword });
    }

    calculateScore = (passphrase: string) => {
        const { minLength } = this.props;
        let score = 0;

        // passphrase < options.minimumLength
        if (passphrase.length === 0) {
            return 0;
        }

        // passphrase < options.minimumLength
        if (passphrase.length < minLength) {
            return 1;
        }

        // passphrase length
        score += passphrase.length * 4;
        score += this.checkRepetition(1, passphrase).length - passphrase.length;
        score += this.checkRepetition(2, passphrase).length - passphrase.length;
        score += this.checkRepetition(3, passphrase).length - passphrase.length;
        score += this.checkRepetition(4, passphrase).length - passphrase.length;

        // passphrase has 3 numbers
        if (passphrase.match(/(.*[0-9].*[0-9].*[0-9])/)) {
            score += 5;
        }

        // passphrase has at least 2 symbols
        const symbols = '.*[!,@,#,$,%,^,&,*,?,_,~]';
        const symbolsRegex = new RegExp(`(${symbols}${symbols})`);
        if (passphrase.match(symbolsRegex)) {
            score += 5;
        }

        // passphrase has Upper and Lower chars
        if (passphrase.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
            score += 10;
        }

        // passphrase has number and chars
        if (passphrase.match(/([a-zA-Z])/) && passphrase.match(/([0-9])/)) {
            score += 15;
        }

        // passphrase has number and symbol
        if (passphrase.match(/([!,@,#,$,%,^,&,*,?,_,~])/) && passphrase.match(/([0-9])/)) {
            score += 15;
        }

        // passphrase has char and symbol
        if (passphrase.match(/([!,@,#,$,%,^,&,*,?,_,~])/) && passphrase.match(/([a-zA-Z])/)) {
            score += 15;
        }

        // passphrase is just numbers or chars
        if (passphrase.match(/^\w+$/) || passphrase.match(/^\d+$/)) {
            score -= 10;
        }

        if (score > 100) {
            score = 100;
        }

        if (score < 0) {
            score = 0;
        }

        return score;
    };

    checkRepetition = (rLen: number, str: string) => {
        let res = '';
        let repeated = false;
        for (let i = 0; i < str.length; i++) {
            repeated = true;
            let j = 0;
            for (j = 0; j < rLen && j + i + rLen < str.length; j++) {
                repeated = repeated && str.charAt(j + i) === str.charAt(j + i + rLen);
            }
            if (j < rLen) {
                repeated = false;
            }
            if (repeated) {
                i += rLen - 1;
                repeated = false;
            } else {
                res += str.charAt(i);
            }
        }
        return res;
    };

    onChangeText(password: string) {
        const { onChange, validate } = this.props;

        if (!validate) {
            if (onChange) {
                return onChange(password, true);
            }
        }

        let isValid = false;

        const score = this.calculateScore(password);

        this.setState({
            score,
        });

        if (score > 70) {
            isValid = true;
        }

        if (onChange) {
            return onChange(password, isValid);
        }

        return undefined;
    }

    setInputWidth = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;

        this.setState({
            inputWidth: width,
        });
    };

    renderPasswordStrength() {
        const { score, inputWidth } = this.state;

        const absoluteWidth = Math.round((score * inputWidth) / 100);

        const normalizedScore = score / 100;
        const normalizedIndex = Math.floor((LEVELS.length - 1) * normalizedScore);
        const { label, labelColor, activeBarColor } = LEVELS[normalizedIndex];

        Animated.timing(this.animatedBarWidth, {
            toValue: absoluteWidth,
            duration: 700,
            useNativeDriver: false,
        }).start();

        return (
            <View style={[styles.passwordStrengthWrapper]}>
                <View style={[styles.barContainer, { backgroundColor: barColor, width: inputWidth }]}>
                    <Animated.View
                        style={[styles.bar, { width: this.animatedBarWidth, backgroundColor: activeBarColor }]}
                    />
                </View>
                {score !== 0 ? <Text style={[styles.label, { color: labelColor }]}>{label}</Text> : null}
            </View>
        );
    }

    renderPasswordInput() {
        const { testID, inputWrapperStyle, inputStyle, editable, placeholder, selectTextOnFocus } = this.props;
        const { hidePassword } = this.state;

        return (
            <View style={[styles.inputWrapper, inputWrapperStyle, AppStyles.stretchSelf]} onLayout={this.setInputWidth}>
                <TextInput
                    testID={testID}
                    ref={r => {
                        this.instance = r;
                    }}
                    editable={editable}
                    placeholderTextColor={StyleService.value('$grey')}
                    secureTextEntry={hidePassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline={false}
                    underlineColorAndroid="transparent"
                    style={[styles.input, inputStyle]}
                    onChangeText={text => this.onChangeText(text)}
                    placeholder={placeholder}
                    selectTextOnFocus={selectTextOnFocus}
                />
                <TouchableOpacity
                    style={{}}
                    disabled={!editable}
                    onPress={() => {
                        this.toggleSwitch();
                    }}
                >
                    <Icon
                        size={22}
                        name={hidePassword ? 'IconEye' : 'IconEyeOff'}
                        style={[styles.eyeIcon, !editable ? { tintColor: StyleService.value('$grey') } : null]}
                    />
                </TouchableOpacity>
            </View>
        );
    }

    render() {
        const { validate } = this.props;

        if (!validate) {
            return this.renderPasswordInput();
        }
        return (
            <Fragment key="passphrase-container">
                {this.renderPasswordInput()}
                {this.renderPasswordStrength()}
            </Fragment>
        );
    }
}
