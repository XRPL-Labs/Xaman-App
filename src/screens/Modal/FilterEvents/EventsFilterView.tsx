/**
 * Events Filter Screen
 */

import { uniqBy, flatMap, map } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, ScrollView, BackHandler, NativeEventSubscription } from 'react-native';

import { NetworkService } from '@services';

import { CoreRepository } from '@store/repositories';
import { AccountModel, TrustLineModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';

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
    Check = 'Check',
    Payment = 'Payment',
    TrustSet = 'TrustSet',
    NFT = 'NFT',
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
    account: AccountModel;
    filters: FilterProps;
}

/* Component ==================================================================== */
class EventsFilterView extends Component<Props, State> {
    static screenName = AppScreens.Modal.FilterEvents;

    private backHandler: NativeEventSubscription;

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
            account: CoreRepository.getDefaultAccount(),
            filters: props.currentFilters,
        };
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
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
                key={value}
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

    renderAccountCurrencies = () => {
        const { account } = this.state;

        const currencies = flatMap(
            uniqBy(account.lines, 'currency.currency'),
            (l: TrustLineModel) => l.currency.currency,
        );

        return map(currencies, (value: string) => {
            return this.renderButton('Currency', NormalizeCurrencyCode(value), value);
        });
    };

    render() {
        const { account } = this.state;

        return (
            <SafeAreaView testID="events-filter-view" style={[AppStyles.container]}>
                {/* Header */}
                <View style={[AppStyles.row, AppStyles.paddingVerticalSml, styles.headerContainer]}>
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.paddingLeft,
                            AppStyles.paddingRightSml,
                            AppStyles.centerContent,
                        ]}
                    >
                        <Text numberOfLines={1} style={AppStyles.h4}>
                            {Localize.t('global.filter')}
                        </Text>
                    </View>
                    <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
                        <Button
                            numberOfLines={1}
                            roundedSmall
                            light
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
                        <Text numberOfLines={1} style={AppStyles.h5}>
                            {Localize.t('global.direction')}
                        </Text>
                        <View style={[styles.row]}>
                            {this.renderButton('ExpenseType', Localize.t('global.income'), 'Income')}
                            {this.renderButton('ExpenseType', Localize.t('global.outcome'), 'Outcome')}
                        </View>

                        <Spacer size={15} />
                        {/* Transaction Type */}
                        <Text numberOfLines={1} style={AppStyles.h5}>
                            {Localize.t('events.transactionType')}
                        </Text>
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
                                Localize.t(`global.${TransactionTypes.Check.toLowerCase()}`),
                                TransactionTypes.Check,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.NFT.toLowerCase()}`),
                                TransactionTypes.NFT,
                            )}
                            {this.renderButton(
                                'TransactionType',
                                Localize.t(`global.${TransactionTypes.Other.toLowerCase()}`),
                                TransactionTypes.Other,
                            )}
                        </View>

                        <Spacer size={15} />
                        <Text numberOfLines={1} style={AppStyles.h5}>
                            {Localize.t('global.asset')}
                        </Text>
                        <View style={[styles.row]}>
                            {this.renderButton('Currency', NetworkService.getNativeAsset())}
                            {account.lines && this.renderAccountCurrencies()}
                        </View>

                        <Spacer size={15} />
                        <Text numberOfLines={1} style={AppStyles.h5}>
                            {Localize.t('global.amount')}
                        </Text>
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
