import React from 'react';
import { Text } from 'react-native';

import renderer from 'react-test-renderer';

import { TouchableDebounce } from '../TouchableDebounce';
import { ExpandableView } from '../ExpandableView';

jest.useFakeTimers();

describe('[ExpandableView]', () => {
    const defaultProps = {
        title: 'Expandable Title',
        titleStyle: {},
        children: <Text>Expandable Content</Text>,
    };

    it('renders correctly when collapsed', () => {
        // eslint-disable-next-line react/jsx-props-no-spreading
        const tree = renderer.create(<ExpandableView {...defaultProps} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly when expanded', () => {
        // eslint-disable-next-line react/jsx-props-no-spreading
        const tree = renderer.create(<ExpandableView {...defaultProps} expanded />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('expands when footer is pressed', () => {
        // eslint-disable-next-line react/jsx-props-no-spreading
        const component = renderer.create(<ExpandableView {...defaultProps} />);
        const instance = component.root;
        const footerButton = instance.findByType(TouchableDebounce);

        expect(instance.instance.state.expanded).toBe(false);

        renderer.act(() => {
            footerButton.props.onPress();
        });

        expect(instance.instance.state.expanded).toBe(true);
    });

    it('collapses when footer is pressed again', () => {
        // eslint-disable-next-line react/jsx-props-no-spreading
        const component = renderer.create(<ExpandableView {...defaultProps} expanded />);
        const instance = component.root;
        const footerButton = instance.findByType(TouchableDebounce);

        expect(instance.instance.state.expanded).toBe(true);

        renderer.act(() => {
            footerButton.props.onPress();
        });

        expect(instance.instance.state.expanded).toBe(false);
    });
});
