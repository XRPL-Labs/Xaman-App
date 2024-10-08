import React from 'react';
import { TextInput } from 'react-native';
import renderer from 'react-test-renderer';

import { AmountInput, AmountValueType } from '../AmountInput';

describe('[AmountInput]', () => {
    it('renders correctly with default props', () => {
        const tree = renderer.create(<AmountInput />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('renders correctly with specific props', () => {
        const tree = renderer
            .create(
                <AmountInput
                    valueType={AmountValueType.IOU}
                    value="12345.6789"
                    editable={false}
                    fractional
                    returnKeyType="done"
                    placeholderTextColor="#999"
                    testID="amount-input"
                />,
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    it('calls onChange when value changes', () => {
        const onChangeMock = jest.fn();
        const instance = renderer.create(
            <AmountInput valueType={AmountValueType.Native} onChange={onChangeMock} />,
        ).root;

        const textInput = instance.findByType(TextInput);

        textInput.props.onChangeText('100');

        expect(onChangeMock).toHaveBeenCalledWith('100');
    });

    it('formats value correctly based on value type and fractional prop', () => {
        const instance = renderer.create(
            <AmountInput valueType={AmountValueType.IOU} value="123456789.123456789" fractional />,
        ).root;

        expect(instance.findByType(TextInput).props.value).toBe('123456789.1234567');
    });
});
