import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager } from 'react-native';

import { AmountType } from '@common/libs/ledger/parser/types';

import { Button, Icon, LoadingIndicator } from '@components/General';
import { PathFindingItem } from '@components/Modules/PathFindingPicker/PathFindingItem';
import { Amount } from '@common/libs/ledger/parser/common';

import { PathOption } from '@common/libs/ledger/types';
import LedgerPathFinding from '@common/libs/ledger/pathFinding';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: string;
    destination: string;
    amount: AmountType;
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
    private pathFinding: LedgerPathFinding;

    constructor(props: Props) {
        super(props);

        this.state = {
            paymentOptions: undefined,
            selectedItem: undefined,
            isLoading: true,
            isExpired: false,
        };

        this.pathFinding = new LedgerPathFinding(
            props.amount.currency === 'XRP' ? new Amount(props.amount.value).xrpToDrops() : props.amount,
            props.source,
            props.destination,
        );
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { source, amount, destination } = this.props;
        if (prevProps.source !== source) {
            this.pathFinding = new LedgerPathFinding(
                amount.currency === 'XRP' ? new Amount(amount.value).xrpToDrops() : amount,
                source,
                destination,
            );
            this.fetchOptions();
        }
    }

    componentWillUnmount() {
        if (this.pathFinding) {
            // cancel any path finding request
            this.pathFinding.cancel();
            // disable the expire event
            this.pathFinding.off('expire', this.onOptionsExpire);
        }
    }

    componentDidMount() {
        this.pathFinding.on('expire', this.onOptionsExpire);
        InteractionManager.runAfterInteractions(this.fetchOptions);
    }

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
        const { isLoading } = this.state;

        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        this.pathFinding
            .request()
            .then((options) => {
                this.setState({
                    isLoading: false,
                    isExpired: false,
                    paymentOptions: options,
                });
            })
            .catch((e) => {
                this.setState({
                    isLoading: false,
                    paymentOptions: undefined,
                });
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
                <View style={styles.loadingContainer}>
                    <View style={AppStyles.row}>
                        <LoadingIndicator style={{ paddingRight: 10 }} />
                        <Text style={[AppStyles.p, AppStyles.strong]}>Finding payment options</Text>
                    </View>
                </View>
            );
        }

        if (isExpired) {
            return (
                <>
                    <View style={styles.loadingContainer}>
                        <View style={AppStyles.row}>
                            <Icon name="ImageTriangle" style={{ marginRight: 10 }} />
                            <Text style={[AppStyles.p, AppStyles.strong]}>Payment options expired</Text>
                        </View>
                    </View>
                    <Button
                        rounded
                        secondary
                        onPress={this.fetchOptions}
                        label="Find new payment options"
                        style={{ marginBottom: 15 }}
                    />
                </>
            );
        }

        if (!paymentOptions || paymentOptions.length === 0) {
            return (
                <>
                    <View style={styles.loadingContainer}>
                        <View style={AppStyles.row}>
                            <Icon name="ImageTriangle" style={{ marginRight: 10 }} />
                            <Text style={[AppStyles.p, AppStyles.strong]}>No payment options found</Text>
                        </View>
                    </View>
                    <Button
                        rounded
                        secondary
                        onPress={this.fetchOptions}
                        label="Find new payment options"
                        style={{ marginBottom: 15 }}
                    />
                </>
            );
        }

        return <View style={containerStyle}>{paymentOptions.map(this.renderItem)}</View>;
    }
}

export default PathFindingPicker;
