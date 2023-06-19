import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { EscrowCreate } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { FormatDate } from '@common/utils/date';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
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
            destinationDetails: undefined,
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.Destination.address, transaction.Destination.tag)
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
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    recipient={{
                        address: transaction.Destination.address,
                        tag: transaction.Destination.tag,
                        ...destinationDetails,
                    }}
                />

                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount.value}
                        currency={transaction.Amount.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                {transaction.FinishAfter && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.finishAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.FinishAfter)}</Text>
                        </View>
                    </>
                )}

                {transaction.CancelAfter && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.cancelAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.CancelAfter)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default EscrowCreateTemplate;
