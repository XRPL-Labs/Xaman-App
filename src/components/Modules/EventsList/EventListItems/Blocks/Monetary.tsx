import React, { PureComponent } from 'react';

import { AmountText } from '@components/General';

import { MonetaryStatus } from '@common/libs/ledger/factory/types';

import styles from './styles';

import { Props } from './types';
import { TextStyle } from 'react-native';
/* Types ==================================================================== */
interface IProps extends Pick<Props, 'explainer'> {}

interface State {
    value?: string;
    currency?: string;
    prefix?: string;
    style?: TextStyle;
}
/* Component ==================================================================== */
class Monetary extends PureComponent<IProps, State> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            value: undefined,
            currency: undefined,
            prefix: undefined,
            style: undefined,
        };
    }

    static assembleStateProps(mutateReceived: any, mutateSent: any, factor: any) {
        if (mutateReceived) {
            return {
                ...mutateReceived,
                prefix: undefined,
                style: undefined,
            };
        }

        if (mutateSent) {
            return {
                ...mutateSent,
                prefix: '-',
                style: styles.outgoingColor,
            };
        }

        if (factor) {
            return {
                value: factor?.value,
                currency: factor?.currency,
                style: factor?.effect === MonetaryStatus.POTENTIAL_EFFECT ? styles.pendingColor : styles.naturalColor,
            };
        }

        return null;
    }

    static getDerivedStateFromProps(nextProps: IProps, prevState: State): Partial<State> | null {
        const { explainer } = nextProps;

        if (typeof explainer === 'undefined' || prevState.value) {
            return null;
        }

        const monetaryDetails = explainer.getMonetaryDetails();

        // no details
        if (!monetaryDetails) {
            return null;
        }

        const { mutate, factor } = monetaryDetails;

        const stateProps = Monetary.assembleStateProps(mutate?.received, mutate?.sent, factor);

        if (!stateProps) {
            return null;
        }

        return {
            value: stateProps.value,
            currency: stateProps.currency,
            style: stateProps.style,
            prefix: stateProps.prefix,
        };
    }

    render() {
        const { value, currency, style, prefix } = this.state;

        // nothing to show
        if (!value) {
            return null;
        }

        return (
            <AmountText
                value={value}
                currency={currency!}
                prefix={prefix}
                style={[styles.amountText, style ?? {}]}
                currencyStyle={styles.currencyText}
                valueContainerStyle={styles.amountValueContainer}
                truncateCurrency
            />
        );
    }
}

export default Monetary;
