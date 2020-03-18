import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';

import { EscrowFinish } from '@common/libs/ledger/transactions';
import { getAccountInfo } from '@common/helpers';

import Localize from '@locale';

import { AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowFinish;
}

export interface State {
    isLoading: boolean;
    ownerName: string;
}

/* Component ==================================================================== */
class EscrowFinishTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            ownerName: '',
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountInfo(transaction.Owner)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        ownerName: res.name,
                    });
                }
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, ownerName } = this.state;
        return (
            <>
                <Text style={[styles.label]}>
                    {Localize.t('global.owner')}:{' '}
                    {isLoading ? (
                        Platform.OS === 'ios' ? (
                            <ActivityIndicator color={AppColors.blue} />
                        ) : (
                            'Loading...'
                        )
                    ) : (
                        <Text style={styles.value}>{ownerName || Localize.t('global.unknown')}</Text>
                    )}
                </Text>
                <View style={[styles.contentBox]}>
                    <Text selectable style={[styles.address]}>
                        {transaction.Owner}
                    </Text>
                </View>
                <Text style={[styles.label]}>{Localize.t('global.offerSequence')}: </Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.OfferSequence}</Text>
                </View>
            </>
        );
    }
}

export default EscrowFinishTemplate;
