/* eslint-disable react/jsx-props-no-spreading */
/**
 * AmountInput
 *
    <AmountInput />
 *
 */

import React, { PureComponent } from 'react';
import { TextInput, TextStyle, ReturnKeyTypeOptions } from 'react-native';

import Localize from '@locale';

/* Types ==================================================================== */
export enum AmountValueType {
    XRP = 'XRP',
    IOU = 'IOU',
}

interface Props {
    valueType: AmountValueType;
    forwardedRef?: any;
    testID?: string;
    style?: TextStyle | TextStyle[];
    value?: string;
    editable?: boolean;
    fractional?: boolean;
    returnKeyType?: ReturnKeyTypeOptions;
    placeholderTextColor?: string;
    onChange?: (value: string) => void;
}

interface State {
    formatted: string;
    value: string;
}
/* Constants ==================================================================== */
const MAX_XRP_DECIMAL_PLACES = 6;
const MAX_IOU_DECIMAL_PLACES = 8;
const MAX_IOU_PRECISION = 15;

/* Component ==================================================================== */
class AmountInput extends PureComponent<Props, State> {
    private instance: TextInput;

    static defaultProps = {
        fractional: true,
        valueType: AmountValueType.XRP,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            formatted: props.value ? AmountInput.format(props.value, props.valueType, props.fractional) : '',
            value: props.value ? AmountInput.normalize(props.value) : '',
        };
    }

    public getValue = (): string => {
        const { value } = this.state;

        return value;
    };

    static getDerivedStateFromProps(nextProps: Props) {
        const formatted = nextProps.value
            ? AmountInput.format(nextProps.value, nextProps.valueType, nextProps.fractional)
            : '';
        const value = nextProps.value ? AmountInput.normalize(nextProps.value) : '';

        return {
            formatted,
            value,
        };
    }

    static normalize = (value: string): string => {
        if (!value) {
            return '';
        }

        if (typeof value === 'number') return String(value);

        return value.replace(',', '.');
    };

    static format = (value: string, valueType: AmountValueType, fractional?: boolean): string => {
        if (!value) {
            return '';
        }

        // 6 decimal places for XRP input
        let decimalPlaces = MAX_XRP_DECIMAL_PLACES;
        if (valueType === AmountValueType.IOU) {
            decimalPlaces = MAX_IOU_DECIMAL_PLACES;
        }

        let formatted = value;

        const separator = Localize.settings?.separator || '.';

        if (separator === ',') {
            formatted = formatted.replace('.', ',');
        } else {
            formatted = formatted.replace(',', '.');
        }

        // "01" to "1"
        if (formatted.length === 2 && formatted[0] === '0' && formatted[1] !== separator) {
            // eslint-disable-next-line
            formatted = formatted[1];
        }

        if (!fractional) {
            // filter only digits are allowed for non fractional values
            return formatted.replace(new RegExp('[^0-9]', 'g'), '');
        }

        // FRACTIONAL values

        // filter only digits and separator
        formatted = formatted.replace(new RegExp(`[^0-9${separator}]`, 'g'), '');

        // remove multiple separator
        if (formatted.split(separator).length > 2) {
            formatted = formatted.replace(new RegExp(`\\${separator}+$`), '');
        }

        // check for decimal places
        if (formatted.split(separator)[1] && formatted.split(separator).reverse()[0].length >= decimalPlaces) {
            formatted = `${formatted.split(separator).reverse()[1]}${separator}${formatted
                .split(separator)
                .reverse()[0]
                .slice(0, decimalPlaces)}`;
        }

        // "." to "0."
        if (formatted.length === 1 && formatted[0] === separator) {
            formatted = `0${separator}`;
        }

        // check for max precision for IOU
        if (valueType === AmountValueType.IOU) {
            if (formatted.replace(separator, '').replace(/0+$/, '').length > MAX_IOU_PRECISION) {
                formatted = formatted.slice(0, formatted.length - 1);
            }
        }

        return formatted;
    };

    onValueChange = (value: string) => {
        const { onChange, fractional, valueType } = this.props;

        const formatted = AmountInput.format(value, valueType, fractional);
        const clean = AmountInput.normalize(formatted);

        this.setState(
            {
                formatted,
                value: clean,
            },
            () => {
                if (typeof onChange === 'function') {
                    onChange(clean);
                }
            },
        );
    };

    render() {
        const { editable, style, testID, returnKeyType, placeholderTextColor, forwardedRef } = this.props;
        const { formatted } = this.state;

        return (
            <TextInput
                testID={testID}
                ref={forwardedRef}
                keyboardType="decimal-pad"
                autoCapitalize="words"
                onChangeText={this.onValueChange}
                returnKeyType={returnKeyType || 'done'}
                placeholder="0"
                style={[style]}
                value={formatted}
                editable={editable}
                placeholderTextColor={placeholderTextColor}
            />
        );
    }
}

/* Export Component ==================================================================== */
export const RefForwardingAmountInput = React.forwardRef<TextInput, Props>((props, ref) => {
    return <AmountInput {...props} forwardedRef={ref} />;
}) as any;
