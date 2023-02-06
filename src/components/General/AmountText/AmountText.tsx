/* eslint-disable react/jsx-props-no-spreading */
/**
 * AmountText
 *
    <AmountText />
 *
 */

import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { Text, Pressable, Alert, TextStyle, ViewStyle, View, InteractionManager, Animated } from 'react-native';
import BigNumber from 'bignumber.js';

import { NormalizeCurrencyCode, XRPLValueToNFT } from '@common/utils/amount';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
interface Props {
    testID?: string;
    isLoading?: boolean;
    prefix?: string | (() => React.ReactNode);
    value: number | string;
    currency?: string;
    truncateCurrency?: boolean;
    style?: TextStyle | TextStyle[];
    valueContainerStyle?: ViewStyle | ViewStyle[];
    currencyStyle?: TextStyle | TextStyle[];
    discreet?: boolean;
    discreetStyle?: TextStyle | TextStyle[];
    immutable?: boolean;
    toggleDisabled?: boolean;
    numberOfLines?: number;
}

interface State {
    originalValue: any;
    value: string;
    currency: string;
    truncated: 'LOW' | 'HIGH';
    showOriginalValue: boolean;
    localSettings: any;
}

/* Component ==================================================================== */
class AmountText extends Component<Props, State> {
    private readonly placeHolderAnimation: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.state = {
            originalValue: undefined,
            value: '',
            currency: '',
            truncated: undefined,
            showOriginalValue: false,
            localSettings: Localize.getSettings(),
        };

        this.placeHolderAnimation = new Animated.Value(0.1);
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.startPlaceholderAnimation);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { value: PropValue, currency, discreet, isLoading } = this.props;
        const { showOriginalValue, value } = this.state;

        return (
            nextProps.value !== PropValue ||
            nextState.value !== value ||
            nextProps.currency !== currency ||
            nextState.showOriginalValue !== showOriginalValue ||
            nextProps.discreet !== discreet ||
            nextProps.isLoading !== isLoading
        );
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { isLoading } = this.props;

        if (!prevProps.isLoading && isLoading) {
            // set animated fade value to zero
            this.placeHolderAnimation.setValue(0.1);

            // start placeholder animation
            this.startPlaceholderAnimation();
        }
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        const { immutable, currency } = nextProps;
        const { localSettings } = prevState;
        let { value } = nextProps;

        const newLocalSettings = Localize.getSettings();

        // no value changed
        if (
            prevState.originalValue === String(value) &&
            prevState.currency === currency &&
            isEqual(newLocalSettings, localSettings)
        ) {
            return null;
        }

        // case passed value to Number
        if (typeof value === 'string') {
            value = Number(value);
        }

        // normalize currency code
        let normalizedCurrency;
        if (typeof currency === 'string' && currency) {
            // normalize currency code
            normalizedCurrency = NormalizeCurrencyCode(currency);
        }

        if (value === 0) {
            return {
                originalValue: String(value),
                value: String(value),
                currency: normalizedCurrency,
                localSettings: newLocalSettings,
            };
        }

        // check if value is NFT
        const NFT = XRPLValueToNFT(value);

        // just show value as NFT
        if (NFT) {
            return {
                originalValue: String(value),
                value: NFT,
                currency: normalizedCurrency,
                localSettings: newLocalSettings,
            };
        }

        // if immutable show original value with formatting
        // without any rounding etc ...
        if (immutable) {
            return {
                originalValue: String(value),
                value: Localize.formatNumber(value, 0, false),
                currency: normalizedCurrency,
                localSettings: newLocalSettings,
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

        if (newValue !== prevState.value || normalizedCurrency !== prevState.currency) {
            return {
                originalValue: String(value),
                value: newValue,
                currency: normalizedCurrency,
                truncated,
                localSettings: newLocalSettings,
            };
        }

        return null;
    }

    startPlaceholderAnimation = () => {
        const { isLoading } = this.props;

        // if the loading is finished, stop the animation
        if (!isLoading) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.placeHolderAnimation, {
                toValue: 0.1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(this.placeHolderAnimation, {
                toValue: 0.3,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

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
        // eslint-disable-next-line prefer-regex-literals
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

    renderImmutableContent = () => {
        const { style, prefix, numberOfLines } = this.props;
        const { value, currency } = this.state;

        return (
            <Text numberOfLines={numberOfLines} style={style}>
                {typeof prefix === 'string' && prefix}
                {value} {typeof currency === 'string' && currency}
            </Text>
        );
    };

    renderValue = () => {
        const { testID, prefix, style, discreet, discreetStyle, valueContainerStyle, numberOfLines } = this.props;
        const { value, originalValue, showOriginalValue } = this.state;

        let showValue = '';

        if (discreet) {
            showValue = '••••••••';
        } else {
            showValue = showOriginalValue ? Localize.formatNumber(originalValue) : value;
        }

        return (
            <View style={[styles.container, valueContainerStyle]}>
                {typeof prefix === 'function' && prefix()}
                <Text testID={testID} numberOfLines={numberOfLines || 1} style={[style, discreet && discreetStyle]}>
                    {typeof prefix === 'string' && prefix}
                    {`${showValue}`}
                </Text>
            </View>
        );
    };

    renderCurrency = () => {
        const { style, currencyStyle, truncateCurrency, numberOfLines } = this.props;
        let { currency } = this.state;

        if (typeof currency !== 'string' || !currency) {
            return null;
        }

        if (currency.length > 4 && truncateCurrency) {
            currency = `${currency.slice(0, 4)}…`;
        }

        return (
            <Text numberOfLines={numberOfLines || 1} style={[style, currencyStyle]}>
                {' '}
                {currency}
            </Text>
        );
    };

    renderPlaceholder = () => {
        const { style } = this.props;

        return (
            <Animated.Text
                numberOfLines={1}
                style={[style, styles.placeholder, { opacity: this.placeHolderAnimation }]}
            >
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </Animated.Text>
        );
    };

    render() {
        const { immutable, isLoading, toggleDisabled } = this.props;
        const { truncated } = this.state;

        // if loading show placeholder
        if (isLoading) {
            return this.renderPlaceholder();
        }

        // in case of immutable content, we show original values without any change
        if (immutable) {
            return this.renderImmutableContent();
        }

        const ContainerComponent = truncated && !toggleDisabled ? Pressable : View;

        return (
            <ContainerComponent onPress={this.onPress} style={styles.container}>
                {this.renderValue()}
                {this.renderCurrency()}
            </ContainerComponent>
        );
    }
}

/* Export Component ==================================================================== */
export default AmountText;
