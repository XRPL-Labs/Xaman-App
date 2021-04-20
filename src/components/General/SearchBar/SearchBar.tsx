/* eslint-disable no-underscore-dangle */

import React, { PureComponent } from 'react';
import { TextInput, View, TextStyle, ViewStyle, Animated, TouchableOpacity } from 'react-native';

import StyleService from '@services/StyleService';

import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onChangeText?: (value: string) => void;
    placeholder?: string;
    inputStyle?: TextStyle;
    containerStyle?: ViewStyle;
}

interface State {
    value: string;
    alpha: Animated.Value;
}

/* Component ==================================================================== */
class SearchBar extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            value: '',
            alpha: new Animated.Value(0),
        };
    }

    static defaultProps = {
        placeholder: 'Please type ...',
        backgroundColor: StyleService.value('$tint'),
        innerBackground: StyleService.value('$tint'),
        radius: 5,
        border: false,
        onChangeText: () => {},
    };

    onChangeText = (value: string) => {
        const { alpha } = this.state;

        const { onChangeText } = this.props;
        this.setState({ value });
        onChangeText(value);

        // @ts-ignore
        if (value && alpha._value === 0) {
            Animated.spring(alpha, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        } else if (!value) {
            Animated.spring(alpha, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    };

    onClearPress = () => {
        this.onChangeText('');
    };

    render() {
        const { placeholder, inputStyle, containerStyle } = this.props;
        const { value, alpha } = this.state;

        return (
            <View style={[styles.searchContainer, containerStyle]}>
                <Animated.View style={[styles.searchIcon]}>
                    <Icon name="IconSearch" size={20} style={AppStyles.imgColorPrimary} />
                </Animated.View>

                <View style={AppStyles.flex1}>
                    <TextInput
                        style={[styles.searchInput, inputStyle]}
                        onChangeText={this.onChangeText}
                        value={value}
                        placeholder={placeholder}
                        placeholderTextColor={StyleService.value('$textSecondary')}
                        underlineColorAndroid="rgba(0,0,0,0)"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                <TouchableOpacity style={[styles.searchClear]} onPress={this.onClearPress}>
                    <Animated.View style={[AppStyles.centerSelf, { opacity: alpha }]}>
                        <Icon name="IconX" size={20} style={AppStyles.imgColorPrimary} />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SearchBar;
