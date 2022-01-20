import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { StyleService } from '@services';

import { CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { FormatDate } from '@common/utils/date';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
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
    currencyName: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
}

/* Component ==================================================================== */
class CheckCreateTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            editableAmount: !props.transaction.SendMax?.value,
            amount: props.transaction.SendMax?.value,
            currencyName: props.transaction.SendMax?.currency
                ? NormalizeCurrencyCode(props.transaction.SendMax.currency)
                : 'XRP',
            destinationDetails: undefined,
        };

        this.amountInput = React.createRef();
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
        getAccountName(transaction.Destination.address, transaction.Destination.tag)
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
        const { isLoading, editableAmount, currencyName, amount, destinationDetails } = this.state;
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

                {/* Amount */}
                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>

                <View style={[styles.contentBox]}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[AppStyles.row]}
                        onPress={() => {
                            if (editableAmount && this.amountInput) {
                                this.amountInput.current?.focus();
                            }
                        }}
                    >
                        <View style={[AppStyles.row, AppStyles.flex1]}>
                            <AmountInput
                                ref={this.amountInput}
                                valueType={currencyName === 'XRP' ? AmountValueType.XRP : AmountValueType.IOU}
                                onChange={this.onSendMaxChange}
                                style={[styles.amountInput]}
                                value={amount}
                                editable={editableAmount}
                                placeholderTextColor={StyleService.value('$textSecondary')}
                            />
                            <Text style={[styles.amountInput]}> {currencyName}</Text>
                        </View>
                        {editableAmount && (
                            <Button
                                onPress={() => {
                                    if (this.amountInput) {
                                        this.amountInput.current?.focus();
                                    }
                                }}
                                style={styles.editButton}
                                light
                                roundedSmall
                                icon="IconEdit"
                                iconSize={13}
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
