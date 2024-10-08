/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import { Text } from 'react-native';

import { TextAvatar } from '../TextAvatar';

describe('[TextAvatar]', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<TextAvatar label="test" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should render label correctly', () => {
        const label = 'label';
        const tree = renderer.create(<TextAvatar label={label} />);

        const textInst = tree.root.findByType(Text);
        expect(textInst.props.children).toBe('L');
        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should render two label correctly', () => {
        const label = 'two label';
        const tree = renderer.create(<TextAvatar label={label} />);

        const textInst = tree.root.findByType(Text);
        expect(textInst.props.children).toBe('TL');
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
