/**
 * Events Filter Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ScrollView, BackHandler } from 'react-native';

import { AccountRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { NormalizeCurrencyCode } from '@common/libs/utils';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { Button, Spacer, Footer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export enum TransactionTypes {
    Escrow = 'Escrow',
    Offer = 'Offer',
    Payment = 'Payment',
    TrustSet = 'TrustSet',
    Other = 'Other',
}

export interface FilterProps {
    ExpenseType: 'Income' | 'Outcome';
    TransactionType: TransactionTypes;
    AmountIndicator: 'Smaller' | 'Bigger';
    Amount: string;
    Currency: string;
    [key: string]: string;
}

export interface Props {
    onDismiss?: () => void;
    onApply: (filter: FilterProps) => void;
    currentFilters: FilterProps;
}

export interface State {
    account: AccountSchema;
    filters: FilterProps;
}

/* Component ==================================================================== */
class EventsFilterView extends Component<Props, State> {
    static screenName = AppScreens.Modal.FilterEvents;

    private backHandler: any;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    static defaultProps: Props = {
        currentFilters: {
            ExpenseType: undefined,
            TransactionType: undefined,
            AmountIndicator: undefined,
            Amount: undefined,
            Currency: undefined,
        },
        onApply: () => {},
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            account: AccountRepository.getDefaultAccount(),
            filters: props.currentFilters,
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);
    }

    dismiss = () => {
        const { onDismiss } = this.props;
        Navigator.dismissModal();

        if (onDismiss) {
            onDismiss();
        }

        return true;
    };

    apply = () => {
        const { filters } = this.state;
        const { onApply } = this.props;

        Navigator.dismissModal();

        if (onApply) {
            onApply(filters);
        }
    };

    renderButton = (type: keyof FilterProps, title: string, value = '') => {
        const { filters } = this.state;

        if (!value) value = title;

        const selected = filters[type] === value;

        return (
            <Button
                onPress={() => {
                    this.setState({
                        filters: {
                            ...filters,
                            [type]: selected ? undefined : value,
                        },
                    });
                }}
                roundedSmall
                style={[styles.optionsButton, selected ? styles.optionsButtonSelected : null]}
                textStyle={[styles.optionsButtonText, selected ? styles.optionsButtonSelectedText : null]}
                label={title}
            />
        );
    };

    render() {
        const { account } = this.state;

        return (
            <SafeAreaView testID="events-filter-view" style={[AppStyles.container]}>
                {/* Header */}
                <View style={[AppStyles.row, AppStyles.paddingVerticalSml, styles.headerContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h4}>{Localize.t('global.filter')}</Text>
                    </View>
                    <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
                        <Button
                            roundedSmall
                            onPress={this.dismiss}
                            style={styles.cancelButton}
                            label={Localize.t('global.cancel').toUpperCase()}
                        />
                    </View>
                </View>
                {/* Content */}

                <View style={[AppStyles.flex8]}>
                    <ScrollView style={[AppStyles.flex1, AppStyles.padding, AppStyles.paddingTopSml]}>
                        {/* Expense */}
                        <Text style={AppStyles.h5}>{Localize.t('global.direction')}</Text>
                        <View style={[styles.row]}>
                            {this.renderButton('ExpenseType', Localize.t('global.income'), 'Income')}
                            {this.renderButton('ExpenseType', Localize.t('global.outcome'), 'Outcome')}
                        </View>

                        <Spacer size={15} />
                        {/* Transaction Type */}
                        <Text style={AppStyles.h5}>{Localize.t('events.transactionType')}</Text>
                        <View style={[styles.row]}>
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.Payment.toLowerCase()}`),
                                TransactionTypes.Payment,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.TrustSet.toLowerCase()}`),
                                TransactionTypes.TrustSet,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.Escrow.toLowerCase()}`),
                                TransactionTypes.Escrow,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.Offer.toLowerCase()}`),
                                TransactionTypes.Offer,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.Other.toLowerCase()}`),
                                TransactionTypes.Other,
                            )}
                        </View>

                        <Spacer size={15} />
                        <Text style={AppStyles.h5}>{Localize.t('global.asset')}</Text>
                        <View style={[styles.row]}>
                            {this.renderButton('Currency', 'XRP')}
                            {account.lines &&
                                account.lines.map((line: TrustLineSchema) => {
                                    return this.renderButton(
                                        'Currency',
                                        NormalizeCurrencyCode(line.currency.currency),
                                        line.currency.currency,
                                    );
                                })}
                        </View>

                        <Spacer size={15} />
                        <Text style={AppStyles.h5}>Amount</Text>
                        <View style={[styles.row]}>
                            {this.renderButton('AmountIndicator', Localize.t('events.smallerThan'), 'Smaller')}
                            {this.renderButton('AmountIndicator', Localize.t('events.biggerThan'), 'Bigger')}
                        </View>
                        <View style={[styles.row]}>
                            {this.renderButton('Amount', '10')}
                            {this.renderButton('Amount', '25')}
                            {this.renderButton('Amount', '50')}
                            {this.renderButton('Amount', '100')}
                            {this.renderButton('Amount', '250')}
                            {this.renderButton('Amount', '500')}
                            {this.renderButton('Amount', '1000')}
                        </View>

                        <Spacer size={50} />
                    </ScrollView>
                </View>

                <Footer style={styles.footerContainer}>
                    <Button label={Localize.t('global.apply')} onPress={this.apply} />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EventsFilterView;
