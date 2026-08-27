import React, { PureComponent } from 'react';
import { TextStyle, View } from 'react-native';

import { AmountText } from '@components/General';
import { MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */
interface IProps extends Pick<Props, 'explainer'> {}

interface AmountLine {
    value: string;
    currency: string;
    prefix?: string;
    style?: TextStyle;
}

interface State {
    value?: string;
    currency?: string;
    prefix?: string;
    style?: TextStyle;
    extra?: AmountLine[];
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
            extra: undefined,
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
        const extra: AmountLine[] = [];

        const remainingFactor = factor?.find((entry) => entry.effect === MonetaryStatus.POTENTIAL_EFFECT);
        const originalFactor = factor?.find((entry) => entry.effect === MonetaryStatus.NO_EFFECT);

        const pushFactor = (entry?: typeof remainingFactor, style?: TextStyle) => {
            if (!entry?.value) {
                return;
            }
            extra.push({
                value: entry.value,
                currency: entry.currency,
                style,
            });
        };

        if (mutate) {
            const mutateReceived = mutate[OperationActions.INC].at(0);
            const mutateSent = mutate[OperationActions.DEC].at(0);

            if (mutateReceived || mutateSent) {
                pushFactor(originalFactor, styles.notEffectedColor);

                if (mutateReceived) {
                    return {
                        ...mutateReceived,
                        prefix: undefined,
                        style: undefined,
                        extra,
                    };
                }

                return {
                    ...mutateSent!,
                    prefix: '-',
                    style: styles.outgoingColor,
                    extra,
                };
            }
        }

        if (factor && factor.length > 0) {
            const primary = factor.find((entry) => !entry.label && entry.effect !== MonetaryStatus.NO_EFFECT) || factor[0];
            factor
                .filter((entry) => entry !== primary)
                .forEach((entry) => {
                    if (entry.label && entry.effect !== MonetaryStatus.NO_EFFECT) {
                        return;
                    }
                    pushFactor(
                        entry,
                        entry.effect === MonetaryStatus.NO_EFFECT ? styles.notEffectedColor : styles.pendingIncColor,
                    );
                });

            return {
                prefix: undefined,
                value: primary.value,
                currency: primary.currency,
                style: primary.action
                    ? primary.action === OperationActions.DEC
                        ? styles.pendingDecColor
                        : styles.pendingIncColor
                    : styles.notEffectedColor,
                extra,
            };
        }

        return null;
    }

    render() {
        const { value, currency, style, prefix, extra } = this.state;

        // nothing to show
        if (!value) {
            return null;
        }

        return (
            <View style={styles.amountValueContainer}>
                <AmountText
                    value={value}
                    currency={currency!}
                    prefix={prefix}
                    style={[styles.amountText, style ?? {}]}
                    currencyStyle={styles.currencyText}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
                {extra?.map((line, index) => (
                    <AmountText
                        key={`paychan-extra-${index}`}
                        value={line.value}
                        currency={line.currency}
                        prefix={line.prefix}
                        style={[styles.currencyText, line.style ?? styles.notEffectedColor]}
                        currencyStyle={styles.currencyText}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                ))}
            </View>
        );
    }
}

export default Monetary;
