import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { Destination } from '@common/libs/ledger/parser/types';

import { LedgerService, NetworkService, StyleService } from '@services';

import { LoanBrokerCoverWithdraw } from '@common/libs/ledger/transactions';
import { LoanBroker, Vault } from '@common/libs/ledger/objects';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement, CurrencyElement } from '@components/Modules';

import { DestinationPickerModalProps } from '@screens/Modal/DestinationPicker';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanBrokerCoverWithdraw;
}

export interface State {
    loanBrokerObject?: LoanBroker;
    vaultObject?: Vault;
    withdrawAmount?: string;
    editableAmount: boolean;
    currencyName: string;
    destination?: Destination;
}

/* Component ==================================================================== */
class LoanBrokerCoverWithdrawTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const currencyName = props.transaction.Amount?.currency
            ? NormalizeCurrencyCode(props.transaction.Amount.currency)
            : '';

        // Initialize destination from transaction if present
        const destination: Destination | undefined = props.transaction.Destination
            ? {
                  address: props.transaction.Destination,
              }
            : undefined;

        this.state = {
            loanBrokerObject: undefined,
            vaultObject: undefined,
            editableAmount: !props.transaction.Amount?.value,
            withdrawAmount: props.transaction.Amount?.value,
            currencyName,
            destination,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchLoanBrokerObject);
    }

    fetchLoanBrokerObject = () => {
        const { transaction } = this.props;

        if (!transaction.LoanBrokerID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.LoanBrokerID })
            .then((res: any) => {
                const loanBrokerEntry = get(res, 'node', undefined);

                if (loanBrokerEntry) {
                    const loanBrokerObject = new LoanBroker(loanBrokerEntry);
                    this.setState({ loanBrokerObject });

                    // Fetch the associated vault to get the asset info
                    if (loanBrokerObject.VaultID) {
                        this.fetchVaultObject(loanBrokerObject.VaultID);
                    }
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('loan.loanBrokerObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('loan.unableToGetLoanBrokerObject'));
            });
    };

    fetchVaultObject = (vaultId: string) => {
        const { withdrawAmount } = this.state;

        LedgerService.getLedgerEntry({ index: vaultId })
            .then((res: any) => {
                const vaultEntry = get(res, 'node', undefined);

                if (vaultEntry) {
                    const vaultObject = new Vault(vaultEntry);

                    const currencyName = vaultObject.Asset?.currency
                        ? NormalizeCurrencyCode(vaultObject.Asset.currency)
                        : NetworkService.getNativeAsset();

                    this.setState({
                        vaultObject,
                        currencyName,
                    });

                    // If no amount set yet, initialize the Amount with vault's asset
                    if (!withdrawAmount && vaultObject.Asset) {
                        this.onAmountChange('');
                    }
                }
            })
            .catch(() => {
                // Vault fetch failed, continue without vault info
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;
        const { vaultObject, currencyName } = this.state;

        this.setState({
            withdrawAmount: amount,
        });

        if (vaultObject?.Asset) {
            if (vaultObject.Asset.issuer) {
                transaction.Amount = {
                    currency: vaultObject.Asset.currency,
                    issuer: vaultObject.Asset.issuer,
                    value: amount,
                };
            } else {
                transaction.Amount = {
                    currency: currencyName,
                    value: amount,
                };
            }
        }
    };

    showDestinationPicker = () => {
        Navigator.showModal<DestinationPickerModalProps>(
            AppScreens.Modal.DestinationPicker,
            {
                onSelect: this.onDestinationSelect,
                onClose: () => {
                    // Modal dismisses itself - no need to call dismissModal here
                },
                ignoreDestinationTag: true,
            },
            {
                modal: {
                    swipeToDismiss: false,
                },
            },
        );
    };

    onDestinationSelect = async (destination: Destination) => {
        const { transaction } = this.props;

        await Navigator.dismissModal();

        this.setState({ destination });

        if (destination?.address) {
            transaction.Destination = destination.address;
        } else {
            transaction.Destination = undefined!;
        }
    };

    clearDestination = () => {
        const { transaction } = this.props;

        this.setState({ destination: undefined });
        transaction.Destination = undefined!;
    };

    focusAmountInput = () => {
        this.amountInput.current?.focus();
    };

    render() {
        const { transaction } = this.props;
        const { loanBrokerObject, vaultObject, editableAmount, currencyName, withdrawAmount, destination } = this.state;

        return (
            <>
                {!isUndefined(transaction.LoanBrokerID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanBrokerId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.LoanBrokerID}</Text>
                        </View>
                    </>
                )}

                {loanBrokerObject?.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <AccountElement
                            address={loanBrokerObject.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {vaultObject?.Asset && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.asset')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement
                                issuer={vaultObject.Asset.issuer}
                                currency={vaultObject.Asset.currency}
                            />
                        </View>
                    </>
                )}

                {loanBrokerObject?.CoverAvailable && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.currentCoverAvailable')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={loanBrokerObject.CoverAvailable}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {/* Withdraw Amount */}
                <Text style={styles.label}>{Localize.t('loan.withdrawAmount')}</Text>
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
                                        value={withdrawAmount}
                                        editable={editableAmount}
                                        placeholderTextColor={StyleService.value('$textSecondary')}
                                    />
                                    <Text style={styles.amountInput}> {currencyName}</Text>
                                </View>
                                <Button
                                    onPress={this.focusAmountInput}
                                    style={styles.editButton}
                                    roundedMini
                                    icon="IconEdit"
                                    iconSize={13}
                                    light
                                />
                            </>
                        ) : (
                            <AmountText
                                value={withdrawAmount!}
                                currency={transaction.Amount?.currency || currencyName}
                                style={styles.amountInput}
                                immutable
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Destination */}
                <View style={AppStyles.row}>
                    <Text style={[styles.label, AppStyles.flex1]}>
                        {Localize.t('loan.recipient')} ({Localize.t('global.optional')})
                    </Text>
                    <TouchableOpacity
                        style={[styles.contentBox, styles.addressContainer]}
                        onPress={this.showDestinationPicker}
                        activeOpacity={0.8}
                    >
                        <Button
                            onPress={this.showDestinationPicker}
                            style={styles.editButton}
                            roundedMini
                            icon="IconEdit"
                            iconSize={13}
                            light
                        />
                    </TouchableOpacity>
                </View>

                {destination?.address && (
                    <View
                        style={[
                            AppStyles.row,
                            AppStyles.flex1,
                            AppStyles.marginTopNegativeSml,
                            AppStyles.marginBottomSml,
                        ]}
                    >
                        <AccountElement address={destination.address} containerStyle={AppStyles.flex1} />
                    </View>
                )}
            </>
        );
    }
}

export default LoanBrokerCoverWithdrawTemplate;
