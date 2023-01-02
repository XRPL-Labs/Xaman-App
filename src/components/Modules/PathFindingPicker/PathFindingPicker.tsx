import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager } from 'react-native';

import { AmountType } from '@common/libs/ledger/parser/types';

import { Button, Icon, LoadingIndicator } from '@components/General';
import { PathFindingItem } from '@components/Modules/PathFindingPicker/PathFindingItem';
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
    onLoad: () => void;
    onLoadEnd: () => void;
    onSelect?: (item: PathOption) => void;
    containerStyle?: ViewStyle;
}

interface State {
    paymentOptions: PathOption[];
    selectedItem: PathOption;
    isLoading: boolean;
    isExpired: boolean;
}

/* Component ==================================================================== */
class PathFindingPicker extends Component<Props, State> {
    private readonly pathFinding: LedgerPathFinding;

    constructor(props: Props) {
        super(props);

        this.state = {
            paymentOptions: undefined,
            selectedItem: undefined,
            isLoading: false,
            isExpired: false,
        };

        this.pathFinding = new LedgerPathFinding();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { source } = this.props;

        if (!isEqual(prevProps.source, source)) {
            this.onSourceChange();
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

    onSourceChange = () => {
        // clear selected item
        this.onItemSelect(undefined);

        // cancel current request
        this.pathFinding.close();

        // fetch options again
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
        const { amount, source, destination, onLoad, onLoadEnd } = this.props;
        const { isLoading } = this.state;

        if (isLoading) {
            return;
        }

        this.setState(
            {
                isLoading: true,
            },
            () => {
                // callback
                if (typeof onLoad === 'function') {
                    onLoad();
                }
            },
        );

        this.pathFinding
            .request(amount.currency === 'XRP' ? new Amount(amount.value).xrpToDrops() : amount, source, destination)
            .then((options) => {
                this.setState({
                    isExpired: false,
                    paymentOptions: options,
                });
            })
            .catch((error: any) => {
                if (error.message !== 'CANCELED') {
                    this.setState({
                        isLoading: false,
                        paymentOptions: undefined,
                    });
                }
            })
            .finally(() => {
                this.setState(
                    {
                        isLoading: false,
                    },
                    () => {
                        // callback
                        if (typeof onLoadEnd === 'function') {
                            onLoadEnd();
                        }
                    },
                );
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

    renderItem = (item: PathOption): React.ReactElement => {
        const { amount } = this.props;
        const { selectedItem } = this.state;

        const { source_amount } = item;
        const key = typeof source_amount === 'string' ? 'XRP' : `${source_amount.issuer}:${source_amount.currency}`;
        const selected = isEqual(item, selectedItem);

        return (
            <PathFindingItem amount={amount} key={key} onPress={this.onItemSelect} item={item} selected={selected} />
        );
    };

    render() {
        const { containerStyle } = this.props;
        const { isLoading, isExpired, paymentOptions } = this.state;

        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <View style={AppStyles.row}>
                        <LoadingIndicator style={styles.loadingIndicator} />
                        <Text style={[AppStyles.p, AppStyles.strong]}>{Locale.t('payload.findingPaymentOptions')}</Text>
                    </View>
                </View>
            );
        }

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
                        onPress={this.fetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </>
            );
        }

        if (!paymentOptions || paymentOptions.length === 0) {
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
                        onPress={this.fetchOptions}
                        label={Locale.t('payload.findNewPaymentOptions')}
                        style={styles.newPaymentOptionsButton}
                    />
                </>
            );
        }

        return <View style={containerStyle}>{paymentOptions.map(this.renderItem)}</View>;
    }
}

export default PathFindingPicker;
