import React from 'react';
import { Text } from 'react-native';

import renderer from 'react-test-renderer';

import { Avatar } from '../Avatar';

jest.useFakeTimers();

describe('[Avatar]', () => {
    it('should render correctly', () => {
        const tree = renderer.create(<Avatar source={{ uri: 'https://example.com/avatar.jpg' }} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should render correctly with loading state', () => {
        const tree = renderer.create(<Avatar source={{ uri: 'https://example.com/avatar.jpg' }} isLoading />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should render correctly with a badge', () => {
        const tree = renderer
            .create(<Avatar source={{ uri: 'https://example.com/avatar.jpg' }} badge={() => <Text>Badge</Text>} />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should apply styles correctly', () => {
        const tree = renderer
            .create(
                <Avatar
                    source={{ uri: 'https://example.com/avatar.jpg' }}
                    size={60}
                    border
                    // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                    containerStyle={{ backgroundColor: 'red' }}
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });
});
