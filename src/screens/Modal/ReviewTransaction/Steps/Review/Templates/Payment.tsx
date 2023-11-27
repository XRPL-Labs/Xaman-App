import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { BackendService, LedgerService, NetworkService, StyleService } from '@services';
import { RatesType } from '@services/BackendService';

import { CoreRepository } from '@store/repositories';

import { Payment } from '@common/libs/ledger/transactions';
import { PathOption } from '@common/libs/ledger/types';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { RecipientElement, PaymentOptionsPicker } from '@components/Modules';

import { Toast } from '@common/helpers/interface';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Payment;
}

export interface State {
    account: string;
    isLoading: boolean;
    amount: string;
    currencyName: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
    currencyRate: RatesType;
    isLoadingRate: boolean;
    shouldShowIssuerFee: boolean;
    isLoadingIssuerFee: boolean;
    issuerFee: number;
    selectedPath: PathOption;
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const { transaction } = props;

        this.state = {
            account: undefined,
            isLoading: false,
            editableAmount: !transaction.Amount?.value,
            amount: transaction.Amount?.value,
            currencyName: transaction.Amount?.currency
                ? NormalizeCurrencyCode(transaction.Amount.currency)
                : NetworkService.getNativeAsset(),
            destinationDetails: undefined,
            currencyRate: undefined,
            isLoadingRate: false,
            shouldShowIssuerFee: false,
            isLoadingIssuerFee: false,
            issuerFee: 0,
            selectedPath: undefined,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchDestinationInfo();

        // if native currency then show equal amount in selected currency
        this.fetchCurrencyRate();

        // check issuer fee if IOU payment
        this.fetchIssuerFee();

        // set isReady to false if payment options are required
        this.setIsReady();
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.source?.address !== prevState.account) {
            return { account: nextProps.source?.address };
        }
        return null;
    }

    setIsReady = () => {
        const { payload, setReady } = this.props;

        // disable ready until user selects a payment option
        if (payload.isPathFinding()) {
            setReady(false);
        }
    };

    fetchIssuerFee = () => {
        const { transaction } = this.props;
        const { account } = this.state;

        const issuer = transaction.SendMax?.issuer || transaction.Amount?.issuer;

        // ignore if not sending IOU or sender is issuer or Destination is issuer
        if (!issuer || account === issuer || transaction.Destination?.address === issuer) {
            return;
        }

        this.setState({ isLoadingIssuerFee: true, shouldShowIssuerFee: true });

        // get transfer rate from issuer account
        LedgerService.getAccountTransferRate(issuer)
            .then((issuerFee) => {
                if (issuerFee) {
                    this.setState({
                        issuerFee,
                    });
                }
            })
            .catch(() => {
                this.setState({
                    shouldShowIssuerFee: false,
                });
            })
            .finally(() => {
                this.setState({
                    isLoadingIssuerFee: false,
                });
            });
    };

    fetchCurrencyRate = () => {
        const { transaction } = this.props;

        // only for native payments
        if (transaction.Amount && transaction.Amount.currency !== NetworkService.getNativeAsset()) {
            return;
        }

        this.setState({
            isLoadingRate: true,
        });

        const { currency } = CoreRepository.getSettings();

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState({
                    currencyRate: r,
                    isLoadingRate: false,
                });
            })
            .catch(() => {
                this.setState({
                    isLoadingRate: false,
                });
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

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

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.Amount || transaction.Amount.currency === NetworkService.getNativeAsset()) {
                // @ts-ignore
                transaction.Amount = amount;
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: amount });
                transaction.Amount = payAmount;
            }
        }
    };

    onPathSelect = (path: PathOption) => {
        const { transaction, setReady } = this.props;

        if (path) {
            transaction.SendMax = path.source_amount;

            // SendMax is not allowed for native to native
            if (
                transaction.SendMax.currency === NetworkService.getNativeAsset() &&
                transaction.Amount.currency === NetworkService.getNativeAsset()
            ) {
                transaction.SendMax = undefined;
            }

            // set the transaction path
            if (path.paths_computed.length === 0) {
                transaction.Paths = undefined;
            } else {
                transaction.Paths = path.paths_computed;
            }

            // user can continue signing the transaction
            setReady(true);
        } else {
            // clear any set value
            transaction.SendMax = undefined;
            transaction.Paths = undefined;

            // user cannot continue
            setReady(false);
        }

        this.setState({
            selectedPath: path,
        });
    };

    renderAmountRate = () => {
        const { amount, isLoadingRate, currencyRate } = this.state;

        if (isLoadingRate) {
            return (
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>Loading ...</Text>
                </View>
            );
        }

        // only show rate for native asset
        if (currencyRate && amount) {
            const rate = Number(amount) * currencyRate.rate;
            if (rate > 0) {
                return (
                    <View style={styles.rateContainer}>
                        <Text style={styles.rateText}>
                            ~{currencyRate.code} {Localize.formatNumber(rate)}
                        </Text>
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const { transaction, payload } = this.props;
        const {
            account,
            isLoading,
            editableAmount,
            amount,
            currencyName,
            destinationDetails,
            shouldShowIssuerFee,
            isLoadingIssuerFee,
            issuerFee,
            selectedPath,
        } = this.state;

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
                <>
                    <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                    <View style={styles.contentBox}>
                        <TouchableOpacity
                            activeOpacity={1}
                            style={AppStyles.row}
                            onPress={() => {
                                if (editableAmount) {
                                    this.amountInput.current?.focus();
                                }
                            }}
                        >
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
                                            value={amount}
                                            editable={editableAmount}
                                            placeholderTextColor={StyleService.value('$textSecondary')}
                                        />
                                        <Text style={styles.amountInput}> {currencyName}</Text>
                                    </View>
                                    <Button
                                        onPress={() => {
                                            this.amountInput.current?.focus();
                                        }}
                                        style={styles.editButton}
                                        roundedSmall
                                        icon="IconEdit"
                                        iconSize={13}
                                        light
                                    />
                                </>
                            ) : (
                                <AmountText
                                    value={amount}
                                    currency={transaction.Amount.currency}
                                    style={styles.amountInput}
                                    immutable
                                />
                            )}
                        </TouchableOpacity>
                        {this.renderAmountRate()}
                    </View>
                </>

                {transaction.SendMax && !selectedPath && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.sendMax')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.SendMax.value}
                                currency={transaction.SendMax.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.DeliverMin && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.deliverMin')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.DeliverMin.value}
                                currency={transaction.DeliverMin.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {shouldShowIssuerFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.issuerFee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
                        </View>
                    </>
                )}

                {transaction.InvoiceID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.invoiceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}

                {payload.isPathFinding() && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.payWith')}</Text>
                        <PaymentOptionsPicker
                            source={account}
                            destination={transaction.Destination.address}
                            amount={transaction.Amount}
                            containerStyle={AppStyles.paddingBottomSml}
                            onSelect={this.onPathSelect}
                        />
                    </>
                )}
            </>
        );
    }
}

export default PaymentTemplate;
