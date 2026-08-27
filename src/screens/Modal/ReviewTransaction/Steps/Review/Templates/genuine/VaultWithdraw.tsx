import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import { Destination } from '@common/libs/ledger/parser/types';

import { LedgerService, NetworkService, StyleService } from '@services';

import { VaultWithdraw } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement, CurrencyElement } from '@components/Modules';

import { DestinationPickerModalProps } from '@screens/Modal/DestinationPicker';
import { EnterDestinationTagOverlayProps } from '@screens/Overlay/EnterDestinationTag';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: VaultWithdraw;
}

export interface State {
    vaultObject?: Vault;
    withdrawAmount?: string;
    editableAmount: boolean;
    currencyName: string;
    destination?: Destination;
}

/* Component ==================================================================== */
class VaultWithdrawTemplate extends Component<Props, State> {
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
                  tag: props.transaction.DestinationTag,
              }
            : undefined;

        this.state = {
            vaultObject: undefined,
            editableAmount: !props.transaction.Amount?.value,
            withdrawAmount: props.transaction.Amount?.value,
            currencyName,
            destination,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchVaultObject);
    }

    fetchVaultObject = () => {
        const { transaction } = this.props;
        const { withdrawAmount } = this.state;

        if (!transaction.VaultID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.VaultID })
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
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('vault.vaultObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('vault.unableToGetVaultObject'));
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
                ignoreDestinationTag: false,
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
            if (destination.tag) {
                transaction.DestinationTag = Number(destination.tag);
            } else {
                transaction.DestinationTag = undefined!;
            }
        } else {
            transaction.Destination = undefined!;
            transaction.DestinationTag = undefined!;
        }
    };

    clearDestination = () => {
        const { transaction } = this.props;

        this.setState({ destination: undefined });
        transaction.Destination = undefined!;
        transaction.DestinationTag = undefined!;
    };

    onDestinationTagPress = () => {
        const { destination } = this.state;

        if (!destination) return;

        Navigator.showOverlay<EnterDestinationTagOverlayProps>(AppScreens.Overlay.EnterDestinationTag, {
            buttonType: 'set',
            destination: { address: destination.address, tag: destination.tag?.toString() },
            onFinish: this.onDestinationTagChange,
        });
    };

    onDestinationTagChange = (destinationTag: string) => {
        const { transaction } = this.props;
        const { destination } = this.state;

        if (destination) {
            const updatedDestination = { ...destination, tag: destinationTag ? Number(destinationTag) : undefined };
            this.setState({ destination: updatedDestination });
        }

        if (destinationTag) {
            transaction.DestinationTag = Number(destinationTag);
        } else {
            transaction.DestinationTag = undefined!;
        }
    };

    focusAmountInput = () => {
        this.amountInput.current?.focus();
    };

    render() {
        const { transaction } = this.props;
        const { vaultObject, editableAmount, currencyName, withdrawAmount, destination } = this.state;

        return (
            <>
                {!isUndefined(transaction.VaultID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.vaultId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.VaultID}</Text>
                        </View>
                    </>
                )}

                {vaultObject?.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <AccountElement
                            address={vaultObject.Owner}
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

                {/* Amount */}
                <Text style={styles.label}>{Localize.t('vault.withdrawAmount')}</Text>
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
                    <Text style={[
                        styles.label,
                        AppStyles.flex1,
                    ]}>
                        {Localize.t('vault.assetsRecipient')} ({Localize.t('global.optional')})
                    </Text>
                    <TouchableOpacity
                        style={[
                            styles.contentBox,
                            styles.addressContainer,
                        ]}
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

                {/* Destination Tag */}
                {destination?.address && (
                    <>
                        <View style={[
                            AppStyles.row,
                            AppStyles.flex1,
                            AppStyles.marginTopNegativeSml,
                            AppStyles.marginBottomSml,
                        ]}>
                            <AccountElement
                                address={destination.address}
                                tag={destination.tag}
                                containerStyle={AppStyles.flex1}
                            />
                        </View>

                        <View style={AppStyles.row}>
                            <Text style={[
                                styles.label,
                                AppStyles.flex1,
                            ]}>
                                {Localize.t('global.destinationTag')}
                            </Text>
                            <TouchableOpacity style={styles.contentBox} onPress={this.onDestinationTagPress}>
                                <Button
                                    onPress={this.onDestinationTagPress}
                                    style={styles.editButton}
                                    roundedMini
                                    icon="IconEdit"
                                    iconSize={13}
                                    light
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default VaultWithdrawTemplate;
