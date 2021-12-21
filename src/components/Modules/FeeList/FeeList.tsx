import React, { PureComponent } from 'react';
import { View, Text, ViewStyle } from 'react-native';

// EventListItems
import { FeeListItem } from './FeeListItem';

/* Types ==================================================================== */
interface FeeItems {
    type: string;
    value: number;
    suggested?: boolean;
}

interface Props {
    items: FeeItems[];
    selectedItem: FeeItems;
    onItemPress: (item: any) => void;
    containerStyle?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
class FeeList extends PureComponent<Props> {
    renderItem = (item: FeeItems): React.ReactElement => {
        const { selectedItem, onItemPress } = this.props;

        const { type, value } = item;
        const selected = item.value === selectedItem.value && item.type === selectedItem.type;

        return <FeeListItem key={`${type}${value}`} onPress={onItemPress} item={item} selected={selected} />;
    };

    render() {
        const { items, containerStyle } = this.props;

        // this should never happen
        if (!items || !Array.isArray(items)) {
            return <Text>No Fee available!</Text>;
        }

        return <View style={containerStyle}>{items.map(this.renderItem)}</View>;
    }
}

export default FeeList;
