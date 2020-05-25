import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';

import { AccountDelete } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { getAccountName } from '@common/helpers/resolver';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: AccountDelete;
}

export interface State {
    isLoading: boolean;
    destinationName: string;
}

/* Component ==================================================================== */
class AccountDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            destinationName: '',
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchDestinationInfo();
    }

    fetchDestinationInfo = () => {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        // fetch destination details
        getAccountName(transaction.Destination.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        destinationName: res.name,
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
    };

    render() {
        const { transaction } = this.props;
        const { isLoading, destinationName } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>
                <View style={[styles.contentBox, styles.addressContainer]}>
                    <Text style={[AppStyles.pbold]}>
                        {isLoading ? (
                            Platform.OS === 'ios' ? (
                                <ActivityIndicator color={AppColors.blue} />
                            ) : (
                                'Loading...'
                            )
                        ) : (
                            destinationName || Localize.t('global.noNameFound')
                        )}
                    </Text>
                    <Text selectable numberOfLines={1} style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                        {transaction.Destination.address}
                    </Text>
                    {transaction.Destination.tag && (
                        <View style={[styles.destinationAddress]}>
                            <Text style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                                {Localize.t('global.destinationTag')}:{' '}
                                <Text style={AppStyles.colorBlue}>{transaction.Destination.tag}</Text>
                            </Text>
                        </View>
                    )}
                </View>
            </>
        );
    }
}

export default AccountDeleteTemplate;
