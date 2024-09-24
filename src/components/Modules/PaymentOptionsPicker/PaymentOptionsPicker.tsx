import { isEqual, filter, map } from 'lodash';
import React, { Component } from 'react';
import { View, ViewStyle, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services//NetworkService';

import { Button, InfoMessage } from '@components/General';
import { PaymentOptionItem } from '@components/Modules/PaymentOptionsPicker/PaymentOptionItem';
import { Amount } from '@common/libs/ledger/parser/common';

import { PathFindPathOption } from '@common/libs/ledger/types/methods';

import LedgerPathFinding from '@common/libs/ledger/pathFinding';

import Locale from '@locale';

import styles from './styles';
import { AmountType } from '@common/libs/ledger/parser/types';

/* Types ==================================================================== */
interface Props {
    source: string;
    destination: string;
    amount: AmountType;
    containerStyle?: ViewStyle;
    onLoad?: () => void;
    onLoadEnd?: () => void;
    onSelect?: (item: PathFindPathOption) => void;
}

interface State {
    paymentOptions: PathFindPathOption[];
    localOption: PathFindPathOption;
    selectedItem: PathFindPathOption;
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
            paymentOptions: [],
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
            let localOption = undefined as PathFindPathOption;

            try {
                // paying native currency
                if (amount.currency === NetworkService.getNativeAsset()) {
                    // fetch fresh account balance from ledger
                    const availableBalance = await LedgerService.getAccountAvailableBalance(source);

                    if (Number(availableBalance) >= Number(amount.value)) {
                        localOption = { source_amount: String(amount.value), paths_computed: [] };
                    }
                } else {
                    // paying IOU
                    // eslint-disable-next-line no-lonely-if
                    if (amount.issuer !== source) {
                        // source is not the issuer
                        const sourceLine = await LedgerService.getFilteredAccountLine(source, {
                            issuer: amount.issuer,
                            currency: amount.currency,
                        });

                        // can pay the amount
                        if (
                            sourceLine &&
                            !sourceLine.freeze_peer &&
                            Number(sourceLine.balance) >= Number(amount.value)
                        ) {
                            // get issuer transfer rate
                            const transferRate = await LedgerService.getAccountTransferRate(amount.issuer);

                            if (transferRate) {
                                // if transfer rate, check if we still can pay
                                const withTransferRate = new Amount(amount.value, false).withTransferRate(transferRate);

                                // still can pay after transfer rate applied
                                if (Number(sourceLine.balance) >= Number(withTransferRate)) {
                                    localOption = {
                                        source_amount: {
                                            issuer: amount.issuer,
                                            currency: amount.currency,
                                            value: withTransferRate,
                                        },
                                        paths_computed: [],
                                    };
                                }
                            } else {
                                localOption = {
                                    source_amount: {
                                        issuer: amount.issuer,
                                        currency: amount.currency,
                                        value: amount.value,
                                    },
                                    paths_computed: [],
                                };
                            }
                        }
                    } else {
                        localOption = {
                            source_amount: {
                                issuer: amount.issuer,
                                currency: amount.currency,
                                value: amount.value,
                            },
                            paths_computed: [],
                        };
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
                    amount.currency === NetworkService.getNativeAsset()
                        ? new Amount(amount.value, false).nativeToDrops()
                        : amount,
                    source,
                    destination,
                )
                .then((options) => {
                    // remove local option from options as we include it by default
                    const filteredOptions = filter(options, (item) => {
                        const { paths_computed } = item;
                        return Array.isArray(paths_computed) && paths_computed.length > 0;
                    });

                    // if paying with native currency is available in options, turn drops to native currency
                    const paymentOptions = map(filteredOptions, (item) => {
                        const { source_amount } = item;
                        if (typeof source_amount === 'string') {
                            return Object.assign(item, { source_amount: new Amount(source_amount).dropsToNative() });
                        }
                        return item;
                    });

                    this.setState({
                        isExpired: false,
                        paymentOptions,
                    });
                })
                .catch((error: any) => {
                    if (error.message !== 'CANCELED') {
                        this.setState({
                            paymentOptions: [],
                        });
                    }
                })
                // @ts-ignore
                .finally(resolve);
        });
    };

    onItemSelect = (item: PathFindPathOption) => {
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

    renderItem = (item: PathFindPathOption, index: number): React.ReactElement => {
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

    render() {
        const { containerStyle } = this.props;
        const { isLoading, isExpired, paymentOptions, localOption } = this.state;

        // payment options are expired
        if (isExpired) {
            return (
                <View style={styles.emptyContainer}>
                    <InfoMessage type="neutral" label={Locale.t('payload.paymentOptionsExpired')} />
                    <Button
                        roundedMini
                        icon="IconRepeat"
                        iconSize={15}
                        onPress={this.clearAndFetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </View>
            );
        }

        // no payment option is available
        if (!isLoading && !localOption && (!paymentOptions || paymentOptions.length === 0)) {
            return (
                <View style={styles.emptyContainer}>
                    <InfoMessage type="neutral" label={Locale.t('payload.noPaymentOptionsFound')} />
                    <Button
                        roundedMini
                        icon="IconRepeat"
                        iconSize={15}
                        onPress={this.clearAndFetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </View>
            );
        }

        // render payment options
        const options = localOption ? [localOption, ...paymentOptions] : paymentOptions;

        return <View style={containerStyle}>{options.map(this.renderItem)}</View>;
    }
}

export default PaymentOptionsPicker;
