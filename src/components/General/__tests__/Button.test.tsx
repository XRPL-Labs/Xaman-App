import React from 'react';

import renderer from 'react-test-renderer';

import { Text, ActivityIndicator } from 'react-native';

import { Button } from '..';

describe.skip('Button Component', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('should render without issues', () => {
        const tree = renderer.create(<Button />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should render with label', () => {
        const label = 'label';
        const tree = renderer.create(<Button label={label} />);

        const textInst = tree.root.findByType(Text);
        expect(textInst.props.children).toBe(`${label}`);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should render with loading', () => {
        const tree = renderer.create(<Button isLoading />);
        expect(tree.root.findByType(ActivityIndicator)).toBeTruthy();
        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should render with isDisabled', () => {
        const tree = renderer.create(<Button isDisabled />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    it('should have TouchableNativeFeedback on android ', () => {
        jest.resetModules();
        jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
            OS: 'android',
            Version: 25,
            select() {},
        }));

        const tree = renderer.create(<Button />);

        expect(tree.toJSON()).toMatchSnapshot();

        jest.resetModules();
    });

    it('should render with icon ', () => {
        const tree = renderer.create(<Button icon="IconChevronDown" />);

        expect(tree.toJSON()).toMatchSnapshot();

        jest.resetModules();
    });
});
