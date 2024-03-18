import { get } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { LedgerService, NetworkService, StyleService } from '@services';

import { CheckCash, CheckCreate } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CheckCash;
}

export interface State {
    checkObject?: CheckCreate;
    cashAmount?: string;
    editableAmount: boolean;
    amountField: 'DeliverMin' | 'Amount';
    currencyName: string;
}

/* Component ==================================================================== */
class CheckCashTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const amountField = props.transaction.Amount ? 'Amount' : 'DeliverMin';
        const currencyName = props.transaction[amountField]?.currency
            ? NormalizeCurrencyCode(props.transaction[amountField]!.currency)
            : NetworkService.getNativeAsset();

        this.state = {
            checkObject: undefined,
            editableAmount: !props.transaction.DeliverMin?.value && !props.transaction.Amount?.value,
            cashAmount: props.transaction.DeliverMin?.value || props.transaction.Amount?.value,
            amountField,
            currencyName,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCheckObject);
    }

    fetchCheckObject = () => {
        const { transaction } = this.props;

        // assign actual check object to the CashCheck tx
        LedgerService.getLedgerEntry({ index: transaction.CheckID })
            .then((res: any) => {
                const checkEntry = get(res, 'node', undefined);

                if (checkEntry) {
                    const checkObject = new CheckCreate(checkEntry);

                    this.setState(
                        {
                            checkObject,
                        },
                        () => {
                            transaction.Check = checkObject;
                        },
                    );
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('payload.checkObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToGetCheckObject'));
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;
        const { amountField } = this.state;

        this.setState({
            cashAmount: amount,
        });

        if (!transaction[amountField] || transaction[amountField]!.currency === NetworkService.getNativeAsset()) {
            transaction[amountField] = {
                currency: NetworkService.getNativeAsset(),
                value: amount,
            };
        } else {
            transaction[amountField] = {
                currency: transaction[amountField]?.currency!,
                issuer: transaction[amountField]?.issuer!,
                value: amount,
            };
        }
    };

    focusAmountInput = () => {
        this.amountInput.current?.focus();
    };

    render() {
        const { transaction } = this.props;
        const { checkObject, editableAmount, amountField, currencyName, cashAmount } = this.state;

        return (
            <>
                {checkObject && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.from')}
                            </Text>
                        </View>

                        <AccountElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            address={checkObject?.Account}
                        />

                        {/* Check Amount */}
                        <Text style={styles.label}>{Localize.t('global.checkAmount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={checkObject.SendMax!.value}
                                currency={checkObject.SendMax!.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {/* Amount */}
                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <TouchableOpacity activeOpacity={1} style={AppStyles.row} onPress={this.focusAmountInput}>
                        {editableAmount ? (
                            <>
                                <View style={[AppStyles.row, AppStyles.flex1]}>
                                    <AmountInput
                                        ref={this.amountInput}
                                        valueType={
                                            currencyName === NetworkService.getNativeAsset()
                                                ? AmountValueType.Native
                                                : AmountValueType.IOU
                                        }
                                        onChange={this.onAmountChange}
                                        style={styles.amountInput}
                                        value={cashAmount}
                                        editable={editableAmount}
                                        placeholderTextColor={StyleService.value('$textSecondary')}
                                    />
                                    <Text style={styles.amountInput}> {currencyName}</Text>
                                </View>
                                <Button
                                    onPress={this.focusAmountInput}
                                    style={styles.editButton}
                                    roundedSmall
                                    icon="IconEdit"
                                    iconSize={13}
                                    light
                                />
                            </>
                        ) : (
                            <AmountText
                                value={cashAmount!}
                                currency={transaction[amountField]?.currency || NetworkService.getNativeAsset()}
                                style={styles.amountInput}
                                immutable
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {transaction.CheckID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.checkID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.CheckID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CheckCashTemplate;
