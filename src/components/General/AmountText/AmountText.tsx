/* eslint-disable react/jsx-props-no-spreading */
/**
 * AmountText
 *
    <AmountText />
 *
 */

import React, { Component } from 'react';
import { Text, TextStyle, Pressable, Alert } from 'react-native';
import BigNumber from 'bignumber.js';

import { NormalizeCurrencyCode, XRPLValueToNFT } from '@common/utils/amount';

import Localize from '@locale';

/* Types ==================================================================== */
interface Props {
    testID?: string;
    value: number | string;
    currency?: string;
    prefix?: string;
    style?: TextStyle | TextStyle[];
    currencyStyle?: TextStyle | TextStyle[];
}

interface State {
    originalValue: any;
    value: string;
    truncated: false;
}

/* Component ==================================================================== */
class AmountText extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            originalValue: undefined,
            value: '',
            truncated: false,
        };
    }

    shouldComponentUpdate(nextProps: Props) {
        const { value } = this.props;

        if (nextProps.value !== value) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        let { value } = nextProps;

        if (prevState.originalValue === String(value)) {
            return null;
        }

        if (typeof value === 'string') {
            value = Number(value);
        }

        if (value === 0) {
            return {
                originalValue: String(value),
                value: String(value),
            };
        }

        // check if value is NFT
        const NFT = XRPLValueToNFT(value);

        // just show value as NFT
        if (NFT) {
            return {
                originalValue: String(value),
                value: NFT,
            };
        }

        const PRECISION = 8;
        let newValue = '';
        let truncated = false;

        // value is low, we will show it as zero but better with ellipsis
        if (value < Number(`0.${'0'.repeat(PRECISION)}9`)) {
            // truncate the display value
            newValue = '0…';
            // set the flag
            truncated = true;
        } else {
            const valueNormalized = Localize.formatNumber(value);
            newValue = `${valueNormalized}`;
        }

        if (newValue !== prevState.value) {
            return {
                originalValue: String(value),
                value: newValue,
                truncated,
            };
        }

        return null;
    }

    onPress = () => {
        const { value } = this.props;
        const { truncated } = this.state;

        // if not truncated we don't have to show full amount
        if (!truncated) return;

        let amount = String(value);
        // if value is exponent they show fixed value to the user
        if (new RegExp(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)/g).test(amount)) {
            amount = new BigNumber(value).toFixed();
        }

        Alert.alert(
            Localize.t('global.reallySmallAmount'),
            Localize.t('global.theAmountIsTooSmallToDisplay', { amount }),
        );
    };

    getValue = () => {
        const { value } = this.state;
        return value;
    };

    getCurrency = () => {
        const { currency } = this.props;

        // if currency passed then include it in the content
        if (currency) {
            return NormalizeCurrencyCode(currency);
        }

        return '';
    };

    getPrefix = () => {
        const { prefix } = this.props;

        if (prefix) {
            return `${prefix}`;
        }
        return '';
    };

    render() {
        const { style, currencyStyle } = this.props;

        return (
            <Pressable onPress={this.onPress}>
                <Text numberOfLines={1} style={style}>
                    {this.getPrefix()}
                    {this.getValue()}{' '}
                    <Text numberOfLines={1} style={currencyStyle || style}>
                        {this.getCurrency()}
                    </Text>
                </Text>
            </Pressable>
        );
    }
}

/* Export Component ==================================================================== */
export default AmountText;
