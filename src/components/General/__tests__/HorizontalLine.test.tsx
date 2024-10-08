import React from 'react';
import { View } from 'react-native';
import renderer from 'react-test-renderer';

import { HorizontalLine } from '../HorizontalLine';

import StyleService from '@services/StyleService';

describe('[HorizontalLine]', () => {
    it('should render with default props', () => {
        const component = renderer.create(<HorizontalLine />);
        const { root } = component;

        expect(component.toJSON()).toMatchSnapshot();
        expect(root.findByType(View).props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    borderBottomColor: StyleService.value('$lightGrey'),
                    borderBottomWidth: 2,
                    width: '100%',
                }),
            ]),
        );
    });

    it('should render with custom props', () => {
        const customStyle = { marginBottom: 10 };
        const component = renderer.create(<HorizontalLine width="50%" height={4} color="red" style={customStyle} />);
        const { root } = component;

        expect(component.toJSON()).toMatchSnapshot();
        expect(root.findByType(View).props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining(customStyle),
                expect.objectContaining({
                    borderBottomColor: 'red',
                    borderBottomWidth: 4,
                    width: '50%',
                }),
            ]),
        );
    });
});
