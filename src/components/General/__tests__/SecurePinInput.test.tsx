/**
 * @format
 */

import React from 'react';
// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

import { SecurePinInput } from '..';

describe('[SecurePinInput]', () => {
    it('renders correctly', () => {
        const onInputFinish = jest.fn();

        const tree = renderer.create(<SecurePinInput length={6} onInputFinish={onInputFinish} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with virtualKeyboard', () => {
        const onInputFinish = jest.fn();

        const tree = renderer
            .create(<SecurePinInput virtualKeyboard length={6} onInputFinish={onInputFinish} />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('should call onInputFinish when all pin is entered', () => {
        const onInputFinish = jest.fn();

        const instanceOf = renderer
            .create(<SecurePinInput virtualKeyboard length={6} onInputFinish={onInputFinish} />)
            .getInstance();

        for (let i = 1; i < 7; i++) {
            // @ts-ignore
            instanceOf.onInput('0'.repeat(i));
        }

        // @ts-ignore
        expect(instanceOf.state.digits).toBe('000000');
        expect(onInputFinish).toBeCalledTimes(1);
    });
});
