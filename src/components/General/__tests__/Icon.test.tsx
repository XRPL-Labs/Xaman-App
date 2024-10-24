import React from 'react';
import { Image } from 'react-native';
import renderer from 'react-test-renderer';

import { Images } from '@common/helpers/images';

import { Icon } from '../Icon';

describe('[Icon]', () => {
    it('renders correctly with default props', () => {
        const tree = renderer.create(<Icon name="IconFlaskConical" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with custom size', () => {
        const tree = renderer.create(<Icon name="IconFlaskConical" size={50} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with custom style', () => {
        const customStyle = { tintColor: 'red' };
        const tree = renderer.create(<Icon name="IconFlaskConical" style={customStyle} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('applies the correct image source', () => {
        const component = renderer.create(<Icon name="IconFlaskConical" />);
        const imageInstance = component.root.findByType(Image);
        expect(imageInstance.props.source).toEqual(Images.IconFlaskConical);
    });

    it('applies the correct size style', () => {
        const size = 50;
        const component = renderer.create(<Icon name="IconFlaskConical" size={size} />);
        const imageInstance = component.root.findByType(Image);
        expect(imageInstance.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    width: 78.57142857142857,
                    height: 78.57142857142857,
                }),
            ]),
        );
    });
});
