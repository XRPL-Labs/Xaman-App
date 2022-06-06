/**
 * CheckBox
 *
    <CheckBox />
 *
 */
import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';
import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onPress: () => void;
    checked: boolean;
    label?: string;
    labelSmall?: string;
    description?: string;
    testID?: string;
}

/* Component ==================================================================== */
class CheckBox extends PureComponent<Props> {
    onPress = () => {
        const { onPress } = this.props;
        if (onPress) {
            onPress();
        }
    };

    render() {
        const { checked, label, labelSmall, description, testID } = this.props;
        return (
            <TouchableDebounce
                testID={testID}
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.content, checked && styles.selected]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.box, checked ? styles.boxSelected : null]}>
                        {checked && <Icon name="IconCheckXumm" style={AppStyles.imgColorWhite} size={12} />}
                    </View>
                </View>
                <View style={AppStyles.flex6}>
                    <Text style={[styles.label, checked && styles.labelSelected]}>{label}</Text>
                    {labelSmall && <Text style={[styles.labelSmall]}>{labelSmall}</Text>}
                    {description && (
                        <Text
                            style={[
                                AppStyles.subtext,
                                styles.descriptionText,
                                checked && styles.descriptionTextSelected,
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
export default CheckBox;
