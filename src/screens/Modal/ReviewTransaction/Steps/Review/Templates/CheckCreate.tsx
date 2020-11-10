import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode, FormatDate } from '@common/libs/utils';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, Button } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: CheckCreate;
}

export interface State {
    isLoading: boolean;
    amount: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
}

/* Component ==================================================================== */
class CheckCreateTemplate extends Component<Props, State> {
    amountInput: AmountInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            editableAmount: !props.transaction.SendMax?.value,
            amount: props.transaction.SendMax?.value,
            destinationDetails: { name: '', source: '' },
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
    };

    onSendMaxChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.SendMax || transaction.SendMax.currency === 'XRP') {
                // @ts-ignore
                transaction.SendMax = amount;
            } else {
                transaction.SendMax = {
                    ...transaction.SendMax,
                    ...{ value: amount },
                };
            }
        }
    };

    render() {
        const { transaction } = this.props;
        const { isLoading, editableAmount, amount, destinationDetails } = this.state;
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

                {/* Amount */}
                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>

                <View style={[styles.contentBox]}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[AppStyles.row]}
                        onPress={() => {
                            if (editableAmount && this.amountInput) {
                                this.amountInput.focus();
                            }
                        }}
                    >
                        <View style={[AppStyles.row, AppStyles.flex1]}>
                            <AmountInput
                                ref={(r) => {
                                    this.amountInput = r;
                                }}
                                onChange={this.onSendMaxChange}
                                style={[styles.amountInput]}
                                value={amount}
                                editable={editableAmount}
                            />
                            <Text style={[styles.amountInput]}>
                                {' '}
                                {transaction.SendMax?.currency
                                    ? NormalizeCurrencyCode(transaction.SendMax.currency)
                                    : 'XRP'}
                            </Text>
                        </View>
                        {editableAmount && (
                            <Button
                                onPress={() => {
                                    if (this.amountInput) {
                                        this.amountInput.focus();
                                    }
                                }}
                                style={styles.editButton}
                                roundedSmall
                                iconSize={13}
                                light
                                icon="IconEdit"
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={[styles.label]}>{Localize.t('global.expire')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>
                        {transaction.Expiration
                            ? FormatDate(transaction.Expiration)
                            : Localize.t('global.neverExpires')}
                    </Text>
                </View>

                {transaction.InvoiceID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.invoiceID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.valueSubtext}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCreateTemplate;
