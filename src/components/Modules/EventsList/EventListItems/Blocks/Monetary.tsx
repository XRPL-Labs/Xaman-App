import React, { PureComponent } from 'react';
import { TextStyle } from 'react-native';

import { AmountText } from '@components/General';
import { OperationActions } from '@common/libs/ledger/parser/types';

import styles from './styles';

import { Props } from './types';

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

    static getDerivedStateFromProps(nextProps: IProps): Partial<State> | null {
        const { explainer } = nextProps;

        if (typeof explainer === 'undefined') {
            return null;
        }

        const monetaryDetails = explainer.getMonetaryDetails();

        // no details
        if (!monetaryDetails) {
            return null;
        }

        const { mutate, factor } = monetaryDetails;

        // first check for actions INC and then DEC
        // if not any return the factor
        if (mutate) {
            const mutateReceived = mutate[OperationActions.INC].at(0);
            const mutateSent = mutate[OperationActions.DEC].at(0);

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
        }

        if (factor && factor.length > 0) {
            return {
                prefix: undefined,
                value: factor.at(0)?.value,
                currency: factor.at(0)?.currency,
                style: factor.at(0)?.action
                    ? factor.at(0)?.action === OperationActions.DEC
                        ? styles.pendingDecColor
                        : styles.pendingIncColor
                    : styles.notEffectedColor,
            };
        }

        return null;
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
