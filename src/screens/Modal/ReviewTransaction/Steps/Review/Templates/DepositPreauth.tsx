import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { DepositPreauth } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DepositPreauth;
}

export interface State {
    isLoading: boolean;
    addressDetails: AccountNameType;
}

/* Component ==================================================================== */
class DepositPreauthTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            addressDetails: undefined,
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        const address = transaction.Authorize || transaction.Unauthorize;

        if (!address) return;

        getAccountName(address)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        addressDetails: res,
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
        const { isLoading, addressDetails } = this.state;
        return (
            <>
                {transaction.Authorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.authorize')}
                            </Text>
                        </View>

                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoading}
                            recipient={{
                                address: transaction.Authorize,
                                ...addressDetails,
                            }}
                        />
                    </>
                )}

                {transaction.Unauthorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.unauthorize')}
                            </Text>
                        </View>

                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoading}
                            recipient={{
                                address: transaction.Unauthorize,
                                ...addressDetails,
                            }}
                        />
                    </>
                )}
            </>
        );
    }
}

export default DepositPreauthTemplate;
