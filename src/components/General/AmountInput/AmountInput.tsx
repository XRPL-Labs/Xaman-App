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
interface Props {
    forwardedRef?: any;
    testID?: string;
    style?: TextStyle | TextStyle[];
    value?: string;
    editable?: boolean;
    fractional?: boolean;
    decimalPlaces?: number;
    returnKeyType?: ReturnKeyTypeOptions;
    placeholderTextColor?: string;
    onChange?: (value: string) => void;
}

interface State {
    formatted: string;
    value: string;
}
/* Component ==================================================================== */
class AmountInput extends PureComponent<Props, State> {
    instance: TextInput;

    static defaultProps = {
        fractional: true,
        decimalPlaces: 8,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            formatted: props.value ? AmountInput.format(props.value, props.fractional, props.decimalPlaces) : '',
            value: props.value ? AmountInput.normalize(props.value) : '',
        };
    }

    public getValue = (): string => {
        const { value } = this.state;

        return value;
    };

    static getDerivedStateFromProps(nextProps: Props) {
        const formatted = nextProps.value
            ? AmountInput.format(nextProps.value, nextProps.fractional, nextProps.decimalPlaces)
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

    static format = (value: string, fractional?: boolean, decimalPlaces = 8): string => {
        if (!value) {
            return '';
        }

        let formatted = value;

        const separator = Localize.settings?.separator || '.';

        if (separator === ',') {
            formatted = formatted.replace('.', ',');
        } else {
            formatted = formatted.replace(',', '.');
        }

        if (fractional) {
            // filter amount
            formatted = formatted.replace(new RegExp(`[^0-9${separator}]`, 'g'), '');
            if (formatted.split(separator).length > 2) {
                formatted = formatted.replace(new RegExp(`\\${separator}+$`), '');
            }

            // not more than 8 decimal places
            if (formatted.split(separator)[1] && formatted.split(separator).reverse()[0].length >= decimalPlaces) {
                formatted = `${formatted.split(separator).reverse()[1]}${separator}${formatted
                    .split(separator)
                    .reverse()[0]
                    .slice(0, decimalPlaces)}`;
            }

            // "." to "0."
            if (formatted.length === 1 && formatted[0] === separator) {
                // eslint-disable-next-line
                formatted = `0${separator}`;
            }
        } else {
            // filter amount
            formatted = formatted.replace(new RegExp('[^0-9]', 'g'), '');
        }

        // "01" to "1"
        if (formatted.length === 2 && formatted[0] === '0' && formatted[1] !== separator) {
            // eslint-disable-next-line
            formatted = formatted[1];
        }

        return formatted;
    };

    onValueChange = (value: string) => {
        const { onChange, fractional, decimalPlaces } = this.props;

        const formatted = AmountInput.format(value, fractional, decimalPlaces);
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
