import { isEqual, filter } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { AmountType } from '@common/libs/ledger/parser/types';

import { Button, Icon } from '@components/General';
import { PaymentOptionItem } from '@components/Modules/PaymentOptionsPicker/PaymentOptionItem';
import { Amount } from '@common/libs/ledger/parser/common';

import { PathOption } from '@common/libs/ledger/types';
import LedgerPathFinding from '@common/libs/ledger/pathFinding';

import Locale from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: string;
    destination: string;
    amount: AmountType;
    containerStyle?: ViewStyle;
    onLoad?: () => void;
    onLoadEnd?: () => void;
    onSelect?: (item: PathOption) => void;
}

interface State {
    paymentOptions: PathOption[];
    localOption: PathOption;
    selectedItem: PathOption;
    isLoading: boolean;
    isExpired: boolean;
}

/* Component ==================================================================== */
class PaymentOptionsPicker extends Component<Props, State> {
    private readonly pathFinding: LedgerPathFinding;

    constructor(props: Props) {
        super(props);

        this.state = {
            paymentOptions: Array(3).fill(undefined),
            localOption: undefined,
            selectedItem: undefined,
            isLoading: false,
            isExpired: false,
        };

        this.pathFinding = new LedgerPathFinding();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { source } = this.props;

        if (!isEqual(prevProps.source, source)) {
            InteractionManager.runAfterInteractions(this.clearAndFetchOptions);
        }
    }

    componentWillUnmount() {
        if (this.pathFinding) {
            // cancel any path finding request
            this.pathFinding.close();
            // disable the expire event
            this.pathFinding.off('expire', this.onOptionsExpire);
        }
    }

    componentDidMount() {
        // listen on options expire
        this.pathFinding.on('expire', this.onOptionsExpire);
        // fetch options
        InteractionManager.runAfterInteractions(this.fetchOptions);
    }

    clearAndFetchOptions = () => {
        // clear prev state
        this.setState({
            paymentOptions: Array(3).fill(undefined),
            localOption: undefined,
            isExpired: false,
        });

        // clear selected item
        this.onItemSelect(undefined);

        // cancel current request
        this.pathFinding.close();

        // fetch payment
        this.fetchOptions();
    };

    onOptionsExpire = () => {
        const { paymentOptions } = this.state;

        if (!paymentOptions || paymentOptions.length === 0) {
            return;
        }

        this.setState({
            isExpired: true,
            paymentOptions: undefined,
        });

        this.onItemSelect(undefined);
    };

    fetchOptions = () => {
        const { onLoad, onLoadEnd } = this.props;

        this.setState({
            isLoading: true,
        });

        if (typeof onLoad === 'function') {
            onLoad();
        }

        Promise.all([this.fetchLocalOption(), this.fetchLedgerOptions()]).finally(() => {
            this.setState({
                isLoading: false,
            });

            // callback
            if (typeof onLoadEnd === 'function') {
                onLoadEnd();
            }
        });
    };

    fetchLocalOption = () => {
        const { source, amount } = this.props;

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            let localOption = undefined as PathOption;

            try {
                // paying XRP
                if (amount.currency === 'XRP') {
                    // fetch fresh account balance from ledger
                    const availableBalance = await LedgerService.getAccountAvailableBalance(source);

                    if (Number(availableBalance) >= Number(amount.value)) {
                        localOption = { source_amount: new Amount(amount.value).xrpToDrops(), paths_computed: [] };
                    }
                } else {
                    // paying IOU
                    // eslint-disable-next-line no-lonely-if
                    if (amount.issuer !== source) {
                        // source is not the issuer
                        const sourceLine = await LedgerService.getFilteredAccountLine(source, amount);

                        // can pay the amount
                        if (
                            sourceLine &&
                            !sourceLine.freeze_peer &&
                            Number(sourceLine.balance) >= Number(amount.value)
                        ) {
                            const transferRate = await LedgerService.getAccountTransferRate(amount.issuer);

                            if (transferRate) {
                                localOption = {
                                    source_amount: {
                                        issuer: amount.issuer,
                                        currency: amount.currency,
                                        value: new Amount(amount.value, false).withTransferRate(transferRate),
                                    },
                                    paths_computed: [],
                                };
                            } else {
                                localOption = { source_amount: amount, paths_computed: [] };
                            }
                        }
                    } else {
                        localOption = { source_amount: amount, paths_computed: [] };
                    }
                }
            } catch {
                // ignore
            }

            // set the result
            this.setState(
                {
                    localOption,
                },
                // @ts-ignore
                resolve,
            );
        });
    };

    fetchLedgerOptions = () => {
        const { amount, source, destination } = this.props;

        return new Promise((resolve) => {
            this.pathFinding
                .request(
                    amount.currency === 'XRP' ? new Amount(amount.value).xrpToDrops() : amount,
                    source,
                    destination,
                )
                .then((options) => {
                    // remove the IOU option from options as we include it by default
                    const filteredOptions = filter(options, (item) => {
                        const { paths_computed } = item;
                        return Array.isArray(paths_computed) && paths_computed.length > 0;
                    });

                    this.setState({
                        isExpired: false,
                        paymentOptions: filteredOptions,
                    });
                })
                .catch((error: any) => {
                    if (error.message !== 'CANCELED') {
                        this.setState({
                            paymentOptions: undefined,
                        });
                    }
                })
                // @ts-ignore
                .finally(resolve);
        });
    };

    onItemSelect = (item: PathOption) => {
        const { onSelect } = this.props;
        const { selectedItem } = this.state;

        if (isEqual(selectedItem, item)) {
            this.setState({
                selectedItem: undefined,
            });
            if (typeof onSelect === 'function') {
                onSelect(undefined);
            }
            return;
        }

        this.setState({ selectedItem: item });

        if (typeof onSelect === 'function') {
            onSelect(item);
        }
    };

    renderItem = (item: PathOption, index: number): React.ReactElement => {
        const { amount } = this.props;
        const { selectedItem } = this.state;

        return (
            <PaymentOptionItem
                amount={amount}
                key={index}
                index={index}
                onPress={this.onItemSelect}
                item={item}
                selected={isEqual(item, selectedItem)}
            />
        );
    };

    renderRequestedAmount = () => {
        const { amount } = this.props;
        const { selectedItem, localOption } = this.state;

        if (!localOption) {
            return null;
        }

        return (
            <PaymentOptionItem
                amount={amount}
                key="requested_amount_item"
                index={0}
                onPress={this.onItemSelect}
                item={localOption}
                selected={isEqual(localOption, selectedItem)}
            />
        );
    };

    render() {
        const { containerStyle } = this.props;
        const { isLoading, isExpired, paymentOptions, localOption } = this.state;

        if (isExpired) {
            return (
                <>
                    <View style={styles.emptyContainer}>
                        <View style={AppStyles.row}>
                            <Icon name="ImageTriangle" style={styles.triangleIconContainer} />
                            <Text style={[AppStyles.p, AppStyles.strong]}>
                                {Locale.t('payload.paymentOptionsExpired')}
                            </Text>
                        </View>
                    </View>
                    <Button
                        rounded
                        secondary
                        onPress={this.clearAndFetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </>
            );
        }

        if (!isLoading && (!localOption || !paymentOptions || paymentOptions.length === 0)) {
            return (
                <>
                    <View style={styles.emptyContainer}>
                        <View style={AppStyles.row}>
                            <Icon name="ImageTriangle" style={styles.triangleIconContainer} />
                            <Text style={[AppStyles.p, AppStyles.strong]}>
                                {Locale.t('payload.noPaymentOptionsFound')}
                            </Text>
                        </View>
                    </View>
                    <Button
                        rounded
                        secondary
                        onPress={this.clearAndFetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </>
            );
        }

        return (
            <View style={containerStyle}>
                {this.renderRequestedAmount()}
                {paymentOptions.map(this.renderItem)}
            </View>
        );
    }
}

export default PaymentOptionsPicker;
