import React from 'react';

import renderer from 'react-test-renderer';

import { CheckBox } from '../CheckBox';

describe('[CheckBox]', () => {
    it('renders correctly when checked', () => {
        const tree = renderer
            .create(
                <CheckBox
                    onPress={() => {}}
                    checked
                    label="Test Label"
                    labelSmall="Test Label Small"
                    description="Test Description"
                    testID="testCheckBox"
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly when unchecked', () => {
        const tree = renderer
            .create(
                <CheckBox
                    onPress={() => {}}
                    checked={false}
                    label="Test Label Unchecked"
                    labelSmall="Test Label Small Unchecked"
                    description="Test Description Unchecked"
                    testID="testCheckBoxUnchecked"
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });
});
