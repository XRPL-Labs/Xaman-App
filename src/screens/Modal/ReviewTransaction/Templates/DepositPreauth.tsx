import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text, Platform, ActivityIndicator } from 'react-native';

import { DepositPreauth } from '@common/libs/ledger/transactions';

import { getAccountName } from '@common/helpers/resolver';

import Localize from '@locale';

import { AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: DepositPreauth;
}

export interface State {
    isLoading: boolean;
    addressName: string;
}

/* Component ==================================================================== */
class DepositPreauthTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            addressName: '',
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        const address = transaction.Authorize || transaction.Unauthorize;

        if (!address) return;

        getAccountName(address)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        addressName: res.name,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, addressName } = this.state;
        return (
            <>
                {transaction.Authorize && (
                    <>
                        <Text style={[styles.label]}>
                            {Localize.t('global.authorize')}:{' '}
                            {isLoading ? (
                                Platform.OS === 'ios' ? (
                                    <ActivityIndicator color={AppColors.blue} />
                                ) : (
                                    'Loading...'
                                )
                            ) : (
                                <Text style={styles.value}>{addressName || Localize.t('global.noNameFound')}</Text>
                            )}
                        </Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.address]}>
                                {transaction.Authorize}
                            </Text>
                        </View>
                    </>
                )}

                {transaction.Unauthorize && (
                    <>
                        <Text style={[styles.label]}>
                            {Localize.t('global.unauthorize')}:{' '}
                            {isLoading ? (
                                Platform.OS === 'ios' ? (
                                    <ActivityIndicator color={AppColors.blue} />
                                ) : (
                                    'Loading...'
                                )
                            ) : (
                                <Text style={styles.value}>{addressName || Localize.t('global.noNameFound')}</Text>
                            )}
                        </Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.address]}>
                                {transaction.Unauthorize}
                            </Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default DepositPreauthTemplate;
