import React, { Component } from 'react';
import { Text } from 'react-native';

import { Button, Badge } from '@components/General';

import styles from './styles';
/* Types ==================================================================== */
export type CategoryChipItem = {
    value: string;
    count?: number;
    active?: boolean;
};

interface Props {
    item: CategoryChipItem;
    onPress?: (item: CategoryChipItem) => void;
}

interface State {}
/* Component ==================================================================== */
class ChipButton extends Component<Props, State> {
    onPress = () => {
        const { onPress, item } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

    render() {
        const { item } = this.props;

        return (
            <Button onPress={this.onPress} light roundedMini style={[styles.container]}>
                <Text style={styles.buttonText}>{item.value}</Text>
                {item?.count && (
                    <Badge
                        onPress={this.onPress}
                        label={`${item.count}`}
                        containerStyle={styles.countBadgeContainer}
                        labelStyle={styles.countBadgeLabel}
                    />
                )}
            </Button>
        );
    }
}

export default ChipButton;
