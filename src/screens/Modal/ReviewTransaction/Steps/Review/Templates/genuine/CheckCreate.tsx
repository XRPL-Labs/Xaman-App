import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { NetworkService, StyleService } from '@services';

import { CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/utils/monetary';
import { FormatDate } from '@common/utils/date';

import { AmountInput, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CheckCreate;
}

export interface State {
    amount?: string;
    currencyName: string;
    editableAmount: boolean;
}

/* Component ==================================================================== */
class CheckCreateTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        this.state = {
            editableAmount: !props.transaction.SendMax?.value,
            amount: props.transaction.SendMax?.value,
            currencyName: props.transaction.SendMax?.currency
                ? NormalizeCurrencyCode(props.transaction.SendMax.currency)
                : NetworkService.getNativeAsset(),
        };

        this.amountInput = React.createRef();
    }

    onSendMaxChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.SendMax || transaction.SendMax.currency === NetworkService.getNativeAsset()) {
                transaction.SendMax = {
                    currency: NetworkService.getNativeAsset(),
                    value: amount,
                };
            } else {
                transaction.SendMax = {
                    ...transaction.SendMax,
                    ...{ value: amount },
                };
            }
        }
    };

    focusAmountInput = () => {
        this.amountInput.current?.focus();
    };

    render() {
        const { transaction } = this.props;
        const { editableAmount, currencyName, amount } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <AccountElement
                    address={transaction.Destination}
                    tag={transaction.DestinationTag}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                {/* Amount */}
                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <TouchableOpacity activeOpacity={1} style={AppStyles.row} onPress={this.focusAmountInput}>
                        <View style={[AppStyles.row, AppStyles.flex1]}>
                            <AmountInput
                                ref={this.amountInput}
                                valueType={
                                    currencyName === NetworkService.getNativeAsset()
                                        ? AmountValueType.Native
                                        : AmountValueType.IOU
                                }
                                onChange={this.onSendMaxChange}
                                style={styles.amountInput}
                                value={amount}
                                editable={editableAmount}
                                placeholderTextColor={StyleService.value('$textSecondary')}
                            />
                            <Text style={styles.amountInput}> {currencyName}</Text>
                        </View>
                        {editableAmount && (
                            <Button
                                onPress={this.focusAmountInput}
                                style={styles.editButton}
                                light
                                roundedSmall
                                icon="IconEdit"
                                iconSize={13}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>{Localize.t('global.expire')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>
                        {transaction.Expiration
                            ? FormatDate(transaction.Expiration)
                            : Localize.t('global.neverExpires')}
                    </Text>
                </View>

                {transaction.InvoiceID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.invoiceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCreateTemplate;
