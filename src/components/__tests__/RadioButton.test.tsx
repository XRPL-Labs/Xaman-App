/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
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
        const tree = renderer.create(<RadioButton label="label" checked onPress={onPress} />);

        const touchInst = tree.root.findByType(TouchableOpacity);

        touchInst.props.onPress();

        expect(onPress).toHaveBeenCalled();
    });
});
