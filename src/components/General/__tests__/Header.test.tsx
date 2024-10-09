/**
 * @format
 */

import React from 'react';
import renderer from 'react-test-renderer';

import { Header } from '../Header';

describe('[Header]', () => {
    it('renders correctly with default props', () => {
        const tree = renderer.create(<Header />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with leftComponent', () => {
        const leftComponent = {
            text: 'Left',
        };
        const tree = renderer.create(<Header leftComponent={leftComponent} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with centerComponent', () => {
        const centerComponent = {
            text: 'Center',
        };
        const tree = renderer.create(<Header centerComponent={centerComponent} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with rightComponent', () => {
        const rightComponent = {
            text: 'Right',
        };
        const tree = renderer.create(<Header rightComponent={rightComponent} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with all components', () => {
        const leftComponent = {
            text: 'Left',
        };
        const centerComponent = {
            text: 'Center',
        };
        const rightComponent = {
            text: 'Right',
        };
        const tree = renderer
            .create(
                <Header
                    leftComponent={leftComponent}
                    centerComponent={centerComponent}
                    rightComponent={rightComponent}
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with backgroundColor', () => {
        const tree = renderer.create(<Header backgroundColor="red" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with containerStyle', () => {
        // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
        const tree = renderer.create(<Header containerStyle={{ borderWidth: 1, borderColor: 'blue' }} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
