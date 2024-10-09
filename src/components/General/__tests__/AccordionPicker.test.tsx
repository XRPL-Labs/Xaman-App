import React from 'react';
import { Text } from 'react-native';

import renderer from 'react-test-renderer';

import { AccordionPicker } from '../AccordionPicker';

const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
];
const mockKeyExtractor = (item: any) => item.id;
const mockRenderItem = (item: any, isSelected: boolean) => (
    <Text>{isSelected ? `Selected ${item.name}` : item.name}</Text>
);

describe('[AccordionPicker]', () => {
    it('renders correctly with items', () => {
        const tree = renderer
            .create(<AccordionPicker items={mockItems} keyExtractor={mockKeyExtractor} renderItem={mockRenderItem} />)
            .toJSON();

        expect(tree).toMatchSnapshot();
    });

    it('shows "No Item available" when items list is empty', () => {
        const tree = renderer
            .create(<AccordionPicker items={[]} keyExtractor={mockKeyExtractor} renderItem={mockRenderItem} />)
            .toJSON();

        expect(tree).toMatchSnapshot();
    });
});
