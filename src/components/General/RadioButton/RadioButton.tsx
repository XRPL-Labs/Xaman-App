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
    value: any;
    labelSmall?: string;
    description?: string;
    disabled?: boolean;
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
        const { checked, label, labelSmall, description, disabled, testID, style } = this.props;
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
                ]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.dot, checked && styles.dotSelected]}>
                        {checked && <View style={styles.filled} />}
                    </View>
                </View>
                <View style={AppStyles.flex6}>
                    <Text
                        style={[AppStyles.p, AppStyles.strong, checked ? styles.textColorSelected : styles.textColor]}
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
