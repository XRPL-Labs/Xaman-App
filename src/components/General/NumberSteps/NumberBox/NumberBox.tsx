import React, { PureComponent } from 'react';

import { TouchableOpacity, Text } from 'react-native';

import styles from './styles';
/* Type ==================================================================== */
interface Props {
    active: boolean;
    past?: boolean;
    index: number;
    onPress: (index: number) => void;
}

/* Component ==================================================================== */
export default class NumberBox extends PureComponent<Props> {
    onPress = () => {
        const { onPress, index } = this.props;

        if (typeof onPress === 'function') {
            onPress(index);
        }
    };

    render() {
        const { active, past, index } = this.props;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.box, active && styles.boxActive, past && styles.boxPast]}
            >
                <Text style={[styles.label, active && styles.labelActive, past && styles.labelPast]}>{index + 1}</Text>
            </TouchableOpacity>
        );
    }
}
