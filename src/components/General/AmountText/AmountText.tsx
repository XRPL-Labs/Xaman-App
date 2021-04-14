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
    prefix?: string | (() => React.ReactNode);
    style?: TextStyle | TextStyle[];
    currencyStyle?: TextStyle | TextStyle[];
}

interface State {
    originalValue: any;
    value: string;
    truncated: 'LOW' | 'HIGH';
    showOriginalValue: boolean;
}

/* Component ==================================================================== */
class AmountText extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            originalValue: undefined,
            value: '',
            truncated: undefined,
            showOriginalValue: false,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { value } = this.props;
        const { showOriginalValue } = this.state;

        if (nextProps.value !== value || nextState.showOriginalValue !== showOriginalValue) {
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
        const MAX_VALUE = 99999;

        let newValue = '';
        let truncated;

        // value is low, we will show it as zero but better with ellipsis
        if (value > 0 && value < Number(`0.${'0'.repeat(PRECISION)}9`)) {
            // truncate the display value
            newValue = '0…';
            // set the flag
            truncated = 'LOW';
        } else if (value > MAX_VALUE) {
            const valueNormalized = Localize.formatNumber(Math.trunc(value));
            newValue = `${valueNormalized}`;
            // set the flag
            truncated = 'HIGH';
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

    toggleShowOriginalValue = () => {
        const { showOriginalValue } = this.state;

        this.setState({
            showOriginalValue: !showOriginalValue,
        });
    };

    alertOriginalValue = () => {
        const { originalValue } = this.state;

        let amount = String(originalValue);
        // if value is exponent they show fixed value to the user
        if (new RegExp(/[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)/g).test(amount)) {
            amount = new BigNumber(originalValue).toFixed();
        }

        Alert.alert(
            Localize.t('global.reallySmallAmount'),
            Localize.t('global.theAmountIsTooSmallToDisplay', { amount }),
        );
    };

    onPress = () => {
        const { truncated } = this.state;

        // if not truncated we don't have to show full amount
        if (!truncated) return;

        switch (truncated) {
            case 'HIGH':
                this.toggleShowOriginalValue();
                break;
            case 'LOW':
                this.alertOriginalValue();
                break;
            default:
                break;
        }
    };

    getValue = () => {
        const { value, originalValue, showOriginalValue } = this.state;

        if (showOriginalValue) {
            return Localize.formatNumber(originalValue);
        }

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

        switch (typeof prefix) {
            case 'string':
                return `${prefix}`;
            case 'function':
                return prefix();
            default:
                return '';
        }
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
