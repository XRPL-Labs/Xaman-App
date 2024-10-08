import React from 'react';
import { TextInput } from 'react-native';

import renderer from 'react-test-renderer';

import { DerivationPathInput } from '../DerivationPathInput';

jest.useFakeTimers();

describe('[DerivationPathInput]', () => {
    it('should match snapshot', () => {
        const testRenderer = renderer.create(<DerivationPathInput autoFocus onChange={jest.fn()} />);
        expect(testRenderer.toJSON()).toMatchSnapshot();
    });

    it('should call onChange with correct values', () => {
        const mockOnChange = jest.fn();
        const testRenderer = renderer.create(<DerivationPathInput autoFocus onChange={mockOnChange} />);

        const instance = testRenderer.root;

        const accountPathInput = instance.findAllByType(TextInput)[0];
        const changePathInput = instance.findAllByType(TextInput)[1];
        const addressIndexInput = instance.findAllByType(TextInput)[2];

        accountPathInput.props.onChangeText('1');
        changePathInput.props.onChangeText('23');
        addressIndexInput.props.onChangeText('456');

        expect(mockOnChange).toHaveBeenCalledWith({
            accountPath: '1',
            changePath: '23',
            addressIndex: '456',
        });
    });

    it('should focus the accountPath input if autoFocus is set', () => {
        const testRenderer = renderer.create(<DerivationPathInput autoFocus onChange={jest.fn()} />);
        const instance = testRenderer.root;
        const accountPathInput = instance.findAllByType(TextInput)[0];

        // is focused?
        setTimeout(() => {
            expect(accountPathInput.props.focus).toBeTruthy();
        }, 300);
    });
});
