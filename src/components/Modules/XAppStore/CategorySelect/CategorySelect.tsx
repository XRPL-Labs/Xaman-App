import React, { PureComponent } from 'react';
import { View, ViewStyle } from 'react-native';

import { Button } from '@components/General';

import styles from './styles';

/* Types ==================================================================== */

type Category = {
    title: string;
    value: string;
};

interface Props {
    selected: string;
    categories: Category[];
    onSelect: (category: string) => void;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    selected: string;
}
/* Component ==================================================================== */
class CategorySelect extends PureComponent<Props, State> {
    onItemPress = (item: Category) => {
        const { onSelect, selected } = this.props;

        const { value } = item;

        // already selected
        if (selected === value) {
            return;
        }

        // callback
        if (typeof onSelect === 'function') {
            onSelect(value);
        }
    };

    renderItem = (category: Category) => {
        const { selected } = this.props;

        const { title, value } = category;
        const isSelected = selected === value;

        return (
            <Button
                key={`category-button-${value}`}
                light
                roundedMini
                contrast={isSelected}
                label={title}
                style={styles.button}
                textStyle={!isSelected && styles.buttonText}
                // eslint-disable-next-line react/jsx-no-bind
                onPress={this.onItemPress.bind(null, category)}
            />
        );
    };

    render() {
        const { categories, containerStyle } = this.props;

        return <View style={[styles.container, containerStyle]}>{categories.map(this.renderItem)}</View>;
    }
}

export default CategorySelect;
