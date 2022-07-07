import React from 'react';

import { Switch as RNSwitch, Platform } from 'react-native';
import renderer from 'react-test-renderer';

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

    it('should reduce opacity when disabled on Android', () => {
        Platform.OS = 'android';
        const onChange = jest.fn();
        const treeAndroid = renderer.create(<Switch isDisabled checked onChange={onChange} />);
        const switchInstAndroid = treeAndroid.root.findByType(RNSwitch);
        expect(switchInstAndroid.props.style[1]).toHaveProperty('opacity', 0.5);

        Platform.OS = 'ios';
        const treeIos = renderer.create(<Switch isDisabled checked onChange={onChange} />);
        const switchInstIos = treeIos.root.findByType(RNSwitch);
        expect(switchInstIos.props.style[1]).toHaveProperty('opacity', 1);
    });
});
