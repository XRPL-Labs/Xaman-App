/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import { Spacer } from '..';

describe('[Spacer]', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<Spacer />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders with given size', () => {
        const tree = renderer.create(<Spacer size={20} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
