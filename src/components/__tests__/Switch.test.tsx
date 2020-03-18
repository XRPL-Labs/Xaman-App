/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import { Switch as RNSwitch } from 'react-native';

import { Switch } from '..';

describe('[Switch]', () => {
    it('renders correctly', () => {
        const onChange = jest.fn();
        const tree = renderer.create(<Switch checked onChange={onChange} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders with given label', () => {
        const label = 'A Label I Am';
        const onChange = jest.fn();
        const tree = renderer.create(<Switch title={label} checked onChange={onChange} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('calls the given function when the switch is pressed', () => {
        const onChange = jest.fn();
        const tree = renderer.create(<Switch checked onChange={onChange} />);

        const switchInst = tree.root.findByType(RNSwitch);

        switchInst.props.onValueChange();

        expect(onChange).toHaveBeenCalled();
    });
});
