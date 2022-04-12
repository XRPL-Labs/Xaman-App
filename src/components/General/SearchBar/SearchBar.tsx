/* eslint-disable no-underscore-dangle */

import React, { PureComponent } from 'react';
import { TextInput, View, TextStyle, ViewStyle, Animated, TouchableOpacity } from 'react-native';

import StyleService from '@services/StyleService';

import { Icon } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */

interface Props {
    onChangeText?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onClearButtonPress?: () => void;
    placeholder?: string;
    inputStyle?: TextStyle;
    containerStyle?: ViewStyle | ViewStyle[];
    border?: boolean;
    iconSize?: number;
    clearButtonVisibility: 'always' | 'typing' | 'focus' | 'never';
}

interface State {
    value: string;
    isClearButtonVisible: boolean;
}

/* Component ==================================================================== */
class SearchBar extends PureComponent<Props, State> {
    private readonly animatedAlpha: Animated.Value;
    private readonly inputRef: React.RefObject<TextInput | null>;

    static defaultProps = {
        placeholder: 'Please type ...',
        iconSize: 20,
        border: false,
        clearButtonVisibility: 'typing',
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            value: '',
            isClearButtonVisible: props.clearButtonVisibility === 'always',
        };

        this.inputRef = React.createRef();

        if (props.clearButtonVisibility === 'always') {
            this.animatedAlpha = new Animated.Value(1);
        } else {
            this.animatedAlpha = new Animated.Value(0);
        }
    }

    public clearText = () => {
        this.onChangeText('');
    };

    public focus = () => {
        if (this.inputRef.current) {
            this.inputRef.current.focus();
        }
    };

    public blur = () => {
        if (this.inputRef.current) {
            this.inputRef.current.blur();
        }
    };

    hideClearButton = () => {
        const { isClearButtonVisible } = this.state;

        // already hidden
        if (!isClearButtonVisible) {
            return;
        }

        Animated.timing(this.animatedAlpha, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            this.setState({
                isClearButtonVisible: false,
            });
        });
    };

    showClearButton = () => {
        const { isClearButtonVisible } = this.state;

        // already visible
        if (isClearButtonVisible) {
            return;
        }

        this.setState(
            {
                isClearButtonVisible: true,
            },
            () => {
                Animated.timing(this.animatedAlpha, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            },
        );
    };

    onChangeText = (value: string) => {
        const { onChangeText, clearButtonVisibility } = this.props;

        this.setState({ value });

        if (typeof onChangeText === 'function') {
            onChangeText(value);
        }

        if (clearButtonVisibility !== 'typing') {
            return;
        }

        // @ts-ignore
        if (value) {
            this.showClearButton();
        } else if (!value) {
            this.hideClearButton();
        }
    };

    onFocus = () => {
        const { onFocus, clearButtonVisibility } = this.props;

        if (clearButtonVisibility === 'focus') {
            this.showClearButton();
        }

        if (typeof onFocus === 'function') {
            onFocus();
        }
    };

    onBlur = () => {
        const { onBlur, clearButtonVisibility } = this.props;

        if (clearButtonVisibility === 'focus') {
            this.hideClearButton();
        }

        if (typeof onBlur === 'function') {
            onBlur();
        }
    };

    onClearPress = () => {
        const { onClearButtonPress } = this.props;

        // clear input
        this.onChangeText('');

        if (typeof onClearButtonPress === 'function') {
            onClearButtonPress();
        }
    };

    render() {
        const { placeholder, border, inputStyle, containerStyle, iconSize } = this.props;
        const { value, isClearButtonVisible } = this.state;

        return (
            <TouchableOpacity
                activeOpacity={1}
                style={[styles.searchContainer, border && styles.searchContainerBorder, containerStyle]}
                onPress={this.focus}
            >
                <Animated.View style={[styles.searchIcon]}>
                    <Icon name="IconSearch" size={iconSize} style={AppStyles.imgColorPrimary} />
                </Animated.View>

                <View style={AppStyles.flex1}>
                    <TextInput
                        ref={this.inputRef}
                        style={[styles.searchInput, inputStyle]}
                        onChangeText={this.onChangeText}
                        onFocus={this.onFocus}
                        onBlur={this.onBlur}
                        value={value}
                        placeholder={placeholder}
                        placeholderTextColor={StyleService.value('$textSecondary')}
                        underlineColorAndroid="transparent"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {isClearButtonVisible && (
                    <TouchableOpacity activeOpacity={1} style={[styles.searchClear]} onPress={this.onClearPress}>
                        <Animated.View style={[AppStyles.centerSelf, { opacity: this.animatedAlpha }]}>
                            <Icon name="IconX" size={20} style={AppStyles.imgColorPrimary} />
                        </Animated.View>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    }
}

/* Export Component ==================================================================== */
export default SearchBar;
