import isEqual from 'lodash/isEqual';
import React, { Component } from 'react';
import { View } from 'react-native';

import { Button } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    filters: any;
    onRemovePress: (keys: Array<string>) => void;
}

/* Component ==================================================================== */
class EventsFilterChip extends Component<Props> {
    static defaultProps = {
        showMoreButton: false,
        showAvatar: true,
        showTag: true,
    };

    shouldComponentUpdate(nextProps: Props) {
        const { filters } = this.props;
        return !isEqual(nextProps.filters, filters);
    }

    onRemovePress = (keys: Array<string>) => {
        const { onRemovePress } = this.props;

        if (onRemovePress && typeof onRemovePress === 'function') {
            onRemovePress(keys);
        }
    };

    render() {
        const { filters } = this.props;

        if (!filters) return null;

        return (
            <View style={[styles.rowContainer]}>
                {Object.keys(filters).map((key) => {
                    if (!filters[key] || key === 'Amount') return null;
                    if (key === 'AmountIndicator' && !filters.Amount) return null;

                    let value = filters[key];
                    const keyToRemove = [key];

                    if (key === 'AmountIndicator' && filters.Amount) {
                        value = filters[key] === 'Smaller' ? '< ' : '> ';
                        value += filters.Amount;
                        keyToRemove.push('Amount');

                        if (filters.Currency) {
                            value += ` ${filters.Currency}`;
                            keyToRemove.push('Currency');
                        }
                    }

                    if (key === 'Currency' && filters.Amount && filters.AmountIndicator) {
                        return null;
                    }

                    // get translation text for transaction types and expense Type
                    if (key === 'TransactionType' || key === 'ExpenseType') {
                        value = Localize.t(`global.${filters[key].toLowerCase()}`);
                    }

                    return (
                        <Button
                            key={key}
                            // eslint-disable-next-line react/jsx-no-bind
                            onPress={this.onRemovePress.bind(null, keyToRemove)}
                            roundedSmall
                            style={[styles.filterButton]}
                            textStyle={[styles.filterButtonText]}
                            label={value}
                            iconStyle={AppStyles.imgColorWhite}
                            icon="IconX"
                            iconPosition="right"
                        />
                    );
                })}
            </View>
        );
    }
}

export default EventsFilterChip;
