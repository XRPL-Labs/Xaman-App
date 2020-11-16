import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { EscrowCreate } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { FormatDate } from '@common/libs/utils';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowCreate;
}

export interface State {
    isLoading: boolean;
    destinationDetails: AccountNameType;
}

/* Component ==================================================================== */
class EscrowCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            destinationDetails: {
                name: '',
                source: '',
            },
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.Destination.address)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        destinationDetails: res,
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
        const { isLoading, destinationDetails } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Destination.address,
                        tag: transaction.Destination.tag,
                        ...destinationDetails,
                    }}
                />

                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>{`${transaction.Amount.value} ${transaction.Amount.currency}`}</Text>
                </View>

                {transaction.FinishAfter && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.finishAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{FormatDate(transaction.FinishAfter)}</Text>
                        </View>
                    </>
                )}

                {transaction.CancelAfter && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.cancelAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{FormatDate(transaction.CancelAfter)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default EscrowCreateTemplate;
