import React, { PureComponent } from 'react';
import { FlatList, ViewStyle } from 'react-native';

import { ButtonItem, SegmentButtonType } from './ButtonItem';

import styles from './styles';

/* Types ==================================================================== */
interface State {}

interface Props {
    buttons: SegmentButtonType[];
    activeButton: string;
    containerStyle?: ViewStyle | ViewStyle[];
    onItemPress: (button: SegmentButtonType) => void;
}

/* Component ==================================================================== */
class SegmentButtons extends PureComponent<Props, State> {
    onItemPress = (item: SegmentButtonType) => {
        const { onItemPress } = this.props;

        if (typeof onItemPress === 'function') {
            onItemPress(item);
        }
    };

    renderItem = ({ item }: { item: SegmentButtonType; index: number }) => {
        const { activeButton } = this.props;

        return <ButtonItem item={item} onItemPress={this.onItemPress} isActive={activeButton === item.value} />;
    };

    render() {
        const { buttons, containerStyle } = this.props;

        return (
            <FlatList
                horizontal
                data={buttons}
                renderItem={this.renderItem}
                style={[styles.container, containerStyle]}
            />
        );
    }
}

/* Export Component ==================================================================== */
export default SegmentButtons;
