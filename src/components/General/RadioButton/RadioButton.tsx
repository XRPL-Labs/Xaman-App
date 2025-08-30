/**
 * Radio Button
 *
    <RadioButton />
 *
 */
import React, { PureComponent } from 'react';
import { View, Text, ViewStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onPress: (value: any) => void;
    checked: boolean;
    label: string;
    danger?: boolean;
    value: any;
    labelSmall?: string;
    description?: string;
    disabled?: boolean;
    lessVerticalPadding?: boolean;
    testID?: string;
    style?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
class RadioButton extends PureComponent<Props> {
    onPress = () => {
        const { onPress, value } = this.props;

        if (typeof onPress === 'function') {
            onPress(value);
        }
    };

    render() {
        const {
            checked,
            label,
            danger,
            labelSmall,
            description,
            disabled,
            testID,
            style,
            lessVerticalPadding,
        } = this.props;

        return (
            <TouchableDebounce
                testID={testID}
                activeOpacity={0.8}
                disabled={disabled}
                onPress={this.onPress}
                style={[
                    styles.content,
                    checked && styles.selected,
                    checked && disabled && styles.selectedDisabled,
                    !checked && disabled && styles.disabled,
                    style,
                    danger && checked && styles.dangerSelected,
                    lessVerticalPadding && styles.lessVerticalPadding,
                ]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[
                        styles.dot,
                        checked && styles.dotSelected,
                        danger && checked && styles.dangerSelected,
                    ]}>
                        {checked && <View style={[ styles.filled, danger && styles.danger ]} />}
                    </View>
                </View>
                <View style={AppStyles.flex6}>
                    <Text
                        style={[
                            AppStyles.p,
                            AppStyles.strong,
                            checked ? styles.textColorSelected : styles.textColor,
                            checked && danger && AppStyles.colorRed,
                    ]}
                    >
                        {label}
                    </Text>
                    {labelSmall && (
                        <Text style={[styles.labelSmall, checked ? styles.textColorSelected : styles.textColor]}>
                            {labelSmall}
                        </Text>
                    )}
                    {description && (
                        <Text
                            style={[
                                AppStyles.subtext,
                                styles.descriptionText,
                                checked ? styles.textColorSelected : styles.textColor,
                                checked && danger && AppStyles.colorRed,
                            ]}
                        >
                            {description}
                        </Text>
                    )}
                </View>
            </TouchableDebounce>
        );
    }
}

/* Export Component ==================================================================== */
export default RadioButton;
