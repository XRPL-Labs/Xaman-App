import React from 'react';
import renderer from 'react-test-renderer';

import { TouchableOpacity } from 'react-native';

import { RadioButton } from '..';

describe('[RadioButton]', () => {
    it('renders correctly', () => {
        const onPress = jest.fn();

        const tree = renderer
            .create(
                <RadioButton
                    onPress={onPress}
                    value="VALUE"
                    label="label"
                    labelSmall="label small"
                    description="description"
                    checked={false}
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders checked correctly', () => {
        const onPress = jest.fn();

        const tree = renderer
            .create(
                <RadioButton
                    onPress={onPress}
                    value="VALUE"
                    label="label"
                    labelSmall="label small"
                    description="description"
                    checked
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('calls the given function when the radio button is pressed', () => {
        const onPress = jest.fn();
        const tree = renderer.create(<RadioButton label="label" checked onPress={onPress} value="VALUE" />);

        const touchInst = tree.root.findByType(TouchableOpacity);

        touchInst.props.onPress();

        expect(onPress).toHaveBeenCalled();
    });
});
