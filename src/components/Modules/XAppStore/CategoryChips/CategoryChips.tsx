import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

import { ChipButton, CategoryChipItem } from './ChipButton';

import styles from './styles';
import { Button } from '@components/General';
/* Types ==================================================================== */
interface Props {
    categories: CategoryChipItem[];
    activeCategory?: string;
    visible?: boolean;
    onChipPress?: (item: CategoryChipItem) => void;
    onChipRemovePress?: (item: string) => void;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {}
/* Component ==================================================================== */
class CategoryChips extends Component<Props, State> {
    onChipRemovePress = () => {
        const { activeCategory, onChipRemovePress } = this.props;

        if (typeof onChipRemovePress === 'function') {
            onChipRemovePress(activeCategory!);
        }
    };

    render() {
        const { visible, categories, onChipPress, activeCategory, containerStyle } = this.props;

        if (!visible || categories.length === 0) {
            return null;
        }

        if (activeCategory) {
            return (
                <View style={[styles.containerActive, containerStyle]}>
                    <Button
                        onPress={this.onChipRemovePress}
                        label={activeCategory}
                        roundedSmall
                        icon="IconX"
                        iconSize={18}
                        iconPosition="right"
                    />
                </View>
            );
        }

        return (
            <View style={[styles.container, containerStyle]}>
                {categories.map((category, index) => {
                    return <ChipButton key={`${category.value}${index}`} item={category} onPress={onChipPress} />;
                })}
            </View>
        );
    }
}

export default CategoryChips;
