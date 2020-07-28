/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import { InfoMessage } from '..';

describe('[InfoMessage]', () => {
    describe('renders correctly', () => {
        it('Info', () => {
            const tree = renderer.create(<InfoMessage label="label" type="info" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
        it('Warning', () => {
            const tree = renderer.create(<InfoMessage label="label" type="warning" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
        it('Error', () => {
            const tree = renderer.create(<InfoMessage label="label" type="error" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
    });

    describe('should render with icon', () => {
        it('Info', () => {
            const tree = renderer.create(<InfoMessage label="label" icon="IconInfo" type="info" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
        it('Warning', () => {
            const tree = renderer.create(<InfoMessage label="label" icon="IconInfo" type="warning" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
        it('Error', () => {
            const tree = renderer.create(<InfoMessage label="label" icon="IconInfo" type="error" />).toJSON();
            expect(tree).toMatchSnapshot();
        });
    });
});
