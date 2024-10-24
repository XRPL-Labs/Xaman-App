import React from 'react';

import renderer from 'react-test-renderer';

import { AppColors } from '@theme';

import { TouchableDebounce } from '../TouchableDebounce';
import { Badge, BadgeType } from '../Badge';

describe('[Badge]', () => {
    it('renders correctly with default props', () => {
        const tree = renderer.create(<Badge />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with a label', () => {
        const tree = renderer.create(<Badge label="Test Label" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with specified type', () => {
        const tree = renderer.create(<Badge type={BadgeType.Xrplns} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('applies correct color based on the type', () => {
        const tree = renderer.create(<Badge type={BadgeType.Xrplns} />);
        expect(tree.toJSON()).toMatchSnapshot();
        const backgroundColorStyle = tree.root.findByType(TouchableDebounce).props.style[1].backgroundColor;
        expect(backgroundColorStyle).toEqual(AppColors.brandXrplns);
    });

    it('calls onPress callback when pressed', () => {
        const onPressMock = jest.fn();
        const tree = renderer.create(<Badge onPress={onPressMock} />);
        tree.root.findByType(TouchableDebounce).props.onPress();
        expect(onPressMock).toHaveBeenCalled();
    });

    it('renders correctly with different sizes', () => {
        const treeSmall = renderer.create(<Badge size="small" />).toJSON();
        expect(treeSmall).toMatchSnapshot();

        const treeMedium = renderer.create(<Badge size="medium" />).toJSON();
        expect(treeMedium).toMatchSnapshot();

        const treeLarge = renderer.create(<Badge size="large" />).toJSON();
        expect(treeLarge).toMatchSnapshot();
    });
});
