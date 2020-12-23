/**
 * CheckBox
 *
    <CheckBox />
 *
 */
import React, { PureComponent } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

import { Icon } from '@components/General/Icon';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    onPress: () => void;
    checked: boolean;
    label: string;
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
            <TouchableOpacity
                testID={testID}
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.content, checked ? styles.selected : null]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.box, checked ? styles.boxSelected : null]}>
                        {checked && <Icon name="IconCheckXumm" style={AppStyles.imgColorWhite} size={12} />}
                    </View>
                </View>
                <View style={AppStyles.flex6}>
                    <Text style={[styles.label, checked && styles.labelSelected]}>{label}</Text>
                    {labelSmall && (
                        <Text style={[styles.labelSmall, checked ? AppStyles.colorBlue : AppStyles.colorGreyDark]}>
                            {labelSmall}
                        </Text>
                    )}
                    {description && (
                        <Text
                            style={[
                                AppStyles.subtext,
                                styles.descriptionText,
                                checked ? AppStyles.colorBlue : AppStyles.colorGreyDark,
                            ]}
                        >
                            {description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    }
}

/* Export Component ==================================================================== */
export default CheckBox;
