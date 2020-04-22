import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';

import { EscrowFinish } from '@common/libs/ledger/transactions';
import { getAccountName } from '@common/helpers/resolver';

import Localize from '@locale';

import { AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowFinish;
}

export interface State {
    isLoading: boolean;
    regularKeyName: any;
}

/* Component ==================================================================== */
class SetRegularKeyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            regularKeyName: '',
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.RegularKey)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        regularKeyName: res.name,
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
        const { isLoading, regularKeyName } = this.state;
        return (
            <>
                <Text style={[styles.label]}>
                    {Localize.t('global.regularKey')}:{' '}
                    {isLoading ? (
                        Platform.OS === 'ios' ? (
                            <ActivityIndicator color={AppColors.blue} />
                        ) : (
                            'Loading...'
                        )
                    ) : (
                        <Text style={styles.value}>{regularKeyName || Localize.t('global.noNameFound')}</Text>
                    )}
                </Text>
                <View style={[styles.contentBox]}>
                    <Text selectable style={[styles.address]}>
                        {transaction.RegularKey}
                    </Text>
                </View>
            </>
        );
    }
}

export default SetRegularKeyTemplate;
