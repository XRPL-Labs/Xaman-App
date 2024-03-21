import React, { PureComponent } from 'react';

import { Images } from '@common/helpers/images';

import { Button } from '@components/General/Button';

import styles from './styles';
/* Types ==================================================================== */
export type SegmentButtonType = {
    label: string;
    value: any;
    icon?: Extract<keyof typeof Images, string>;
    testID?: string;
};

interface Props {
    item: SegmentButtonType;
    isActive?: boolean;
    onItemPress?: (item: SegmentButtonType) => void;
}

/* Component ==================================================================== */
class ButtonItem extends PureComponent<Props> {
    onPress = () => {
        const { item, onItemPress } = this.props;

        if (typeof onItemPress === 'function') {
            onItemPress(item);
        }
    };

    render() {
        const { item, isActive } = this.props;

        return (
            <Button
                testID={item.testID}
                light
                roundedMini
                contrast={isActive}
                label={item.label}
                icon={item.icon}
                iconPosition="right"
                style={styles.button}
                textStyle={[styles.buttonText, isActive ? styles.buttonTextSelected : {}]}
                onPress={this.onPress}
            />
        );
    }
}

/* Export ==================================================================== */
export default ButtonItem;
