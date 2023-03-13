import React from 'react';
// Note: test renderer must be required after react-native.

import renderer from 'react-test-renderer';

import { SearchBar } from '..';

jest.useFakeTimers();

describe('[SearchBar]', () => {
    it('renders correctly', () => {
        const tree = renderer.create(<SearchBar />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should show clear button on text enter', () => {
        const tree = renderer.create(<SearchBar />);
        const { instance } = tree.root;
        instance.onChangeText('searched text');

        expect(instance.state.value).toBe('searched text');

        jest.advanceTimersByTime(1000);

        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should clear text', () => {
        const tree = renderer.create(<SearchBar />);
        const { instance } = tree.root;

        instance.onClearPress();

        jest.advanceTimersByTime(1000);

        expect(instance.state.value).toBe('');
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
