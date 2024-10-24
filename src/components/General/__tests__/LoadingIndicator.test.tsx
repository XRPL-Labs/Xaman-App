import React from 'react';
import renderer from 'react-test-renderer';

import StyleService from '@services/StyleService';

import { LoadingIndicator } from '../LoadingIndicator';

describe('[LoadingIndicator]', () => {
    it('renders with default props', () => {
        const tree = renderer.create(<LoadingIndicator />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders with specified color (light)', () => {
        const spyStyleService = jest.spyOn(StyleService, 'value');
        const tree = renderer.create(<LoadingIndicator color="light" />).toJSON();
        expect(tree).toMatchSnapshot();
        expect(spyStyleService).toHaveBeenCalledWith('$white');
    });

    it('renders with specified color (dark)', () => {
        const spyStyleService = jest.spyOn(StyleService, 'value');
        const tree = renderer.create(<LoadingIndicator color="dark" />).toJSON();
        expect(tree).toMatchSnapshot();
        expect(spyStyleService).toHaveBeenCalledWith('$black');
    });

    it('renders with specified size (large)', () => {
        const tree = renderer.create(<LoadingIndicator size="large" />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders while animating is false', () => {
        const tree = renderer.create(<LoadingIndicator animating={false} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders with custom styles', () => {
        const customStyle = { margin: 10 };
        const tree = renderer.create(<LoadingIndicator style={customStyle} />).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
