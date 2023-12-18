import React from 'react';
// Note: test renderer must be required after react-native.

import renderer, { act } from 'react-test-renderer';

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

        act(() => {
            instance.onChangeText('searched text');
        });

        expect(instance.state.value).toBe('searched text');

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should clear text', () => {
        const tree = renderer.create(<SearchBar />);
        const { instance } = tree.root;

        act(() => {
            instance.onClearPress();
            jest.advanceTimersByTime(1000);
        });

        expect(instance.state.value).toBe('');
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
