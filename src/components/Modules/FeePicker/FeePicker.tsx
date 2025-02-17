import { find, isEqual, debounce, omit } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager, TextStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import NetworkService from '@services/NetworkService';
import StyleService from '@services/StyleService';

import { AmountParser } from '@common/libs/ledger/parser/common';

import { Navigator } from '@common/helpers/navigator';
import { Capitalize } from '@common/utils/string';

import { TouchableDebounce, Badge, Button, LoadingIndicator, InfoMessage } from '@components/General';
import BackendService from '@services/BackendService';

import { type Payload } from '@common/libs/payload';

import Localize from '@locale';

import { FeeItem, Props as SelectFeeOverlayProps } from '@screens/Overlay/SelectFee/types';

import { AppStyles } from '@theme';
import styles from './styles';

import { type AccountModel } from '@store/models';
import { AccessLevels, AccountTypes } from '@store/types';

/* Types ==================================================================== */
interface Props {
    txJson: any;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    source?: AccountModel;
    payload?: Payload;
    showHooksFee?: boolean;
    onSelect?: (txFee: any, serviceFee: any) => void;
}

interface State {
    availableFees?: FeeItem[];
    selectedTxFee?: FeeItem;
    selectedServiceFee?: FeeItem;
    feeHooks?: number;
    error: boolean;
}

/* Component ==================================================================== */
class FeePicker extends Component<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof FeePicker.defaultProps>>;

    static defaultProps: Partial<Props> = {
        showHooksFee: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            availableFees: undefined,
            selectedTxFee: undefined,
            selectedServiceFee: undefined,
            feeHooks: undefined,
            error: false,
        };
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { txJson } = this.props;

        // re-fetch the fees when received new transaction json
        if (!isEqual(omit(txJson, 'Fee'), omit(prevProps.txJson, 'Fee'))) {
            this.setState(
                {
                    // Just keep things as is to prevent them from bouncing
                    // around while updating a tx memo.
                    // availableFees: undefined,
                    // selectedTxFee: undefined,
                    // selectedServiceFee: undefined,
                    // feeHooks: undefined,
                    error: false,
                },
                this.debouncedFetchFees,
            );
        }
    }

    componentDidMount() {
        // fetch available fees from network
        InteractionManager.runAfterInteractions(this.fetchFees);
        // InteractionManager.runAfterInteractions(this.fetchServiceFee);
    }

    fetchServiceFee = (isFallback = false): Promise<void> => {
        const { txJson, source, payload } = this.props;

        const noFee = () => {
            this.setState({
                selectedServiceFee: {
                    type: 'LOW',
                    value: '0',
                },
            });
        };

        if (source && source?.accessLevel === AccessLevels.Full && source?.type === AccountTypes.Tangem) {
            // Tangem may sign this, no fees
            return Promise.resolve(noFee());
        }
        
        if (source && source?.accessLevel !== AccessLevels.Full) {
            // We don't know what is going to sign this
            return Promise.resolve(noFee());
        }

        const payloadUuid = payload
            ? payload?.getPayloadUUID()
            : undefined;
        
        // when it's retry with fallback then we don't include txJson
        return BackendService.getServiceFee(!isFallback ? txJson : undefined, payloadUuid)
            .then((res) => {
                // console.log('Picked backend service service fee', res);
                const { availableFees } = res;

                if (Array.isArray(availableFees) && availableFees.length > 0) {
                    this.setState({
                        selectedServiceFee: availableFees[0],
                    });
                };
            })
            .catch(() => {});
    };

    fetchFees = (isFallback = false): Promise<void> => {
        const { txJson } = this.props;
        const { error, selectedServiceFee, selectedTxFee } = this.state;

        // clear any error for retrying again
        if (error) {
            this.setState({
                error: false,
            });
        }

        // when it's retry with fallback then we don't include txJson
        return this.fetchServiceFee().then(() => {
            NetworkService.getAvailableNetworkFee(!isFallback ? txJson : undefined)
                .then((res) => {
                    const { availableFees, feeHooks, suggested } = res;

                    this.setState({
                        availableFees,
                        feeHooks,
                    });

                    // set the suggested fee by default
                    this.onSelect(find(availableFees, {
                        type: selectedTxFee && selectedTxFee?.type
                            ? selectedTxFee.type
                            : suggested,
                    })!, selectedServiceFee);
                })
                .catch(() => {
                    // if it's not a retry fallback then let's try again
                    if (!isFallback) {
                        this.fetchFees(true);
                        return;
                    }
                    // let's give up
                    this.setState({
                        error: true,
                    });
                });
        });
    };

    debouncedFetchFees = debounce(this.fetchFees, 750);

    onSelect = (txFeeItem: FeeItem, serviceFeeItem?: FeeItem) => {
        const { onSelect } = this.props;
        const { selectedServiceFee } = this.state;

        this.setState(
            {
                selectedTxFee: txFeeItem,
                selectedServiceFee: serviceFeeItem || selectedServiceFee,
            },
            () => {
                if (typeof onSelect === 'function') {
                    onSelect(txFeeItem, serviceFeeItem || selectedServiceFee);
                }
            },
        );
    };

    showFeeSelectOverlay = () => {
        const { availableFees, selectedTxFee, selectedServiceFee } = this.state;

        Navigator.showOverlay<SelectFeeOverlayProps>(AppScreens.Overlay.SelectFee, {
            availableFees: availableFees!,
            selectedFee: selectedTxFee!,
            serviceFee: selectedServiceFee!,
            onSelect: this.onSelect,
        });
    };

    getNormalizedFee = () => {
        const { selectedTxFee, selectedServiceFee } = this.state;

        if (!selectedTxFee) {
            return 0;
        }

        return new AmountParser(
            Number(selectedTxFee.value) +
            Number(selectedServiceFee?.value || 0),
        ).dropsToNative().toString();
    };

    getNormalizedHooksFee = () => {
        const { feeHooks } = this.state;

        if (!feeHooks) {
            return 0;
        }

        return new AmountParser(feeHooks).dropsToNative().toString();
    };

    getFeeColor = () => {
        const { selectedTxFee } = this.state;

        switch (selectedTxFee?.type) {
            case 'LOW':
                return StyleService.value('$green');
            case 'MEDIUM':
                return StyleService.value('$orange');
            case 'HIGH':
                return StyleService.value('$red');
            default:
                return StyleService.value('$textPrimary');
        }
    };

    renderError = () => {
        const { containerStyle } = this.props;

        return (
            <View style={containerStyle}>
                <InfoMessage
                    label={Localize.t('global.unableToLoadNetworkFee')}
                    type="error"
                    actionButtonLabel={Localize.t('global.tryAgain')}
                    actionButtonIcon="IconRefresh"
                    onActionButtonPress={this.debouncedFetchFees}
                />
            </View>
        );
    };

    renderLoading = () => {
        const { containerStyle, textStyle } = this.props;

        return (
            <View style={[AppStyles.row, containerStyle]}>
                <Text style={textStyle}>{Localize.t('global.loading')}...&nbsp;</Text>
                <LoadingIndicator />
            </View>
        );
    };

    render() {
        const { containerStyle, textStyle } = this.props;
        const { selectedTxFee, selectedServiceFee, availableFees, feeHooks, error } = this.state;

        // error while fetching the fee
        //  give the user ability to retry
        if (error) {
            return this.renderError();
        }

        // nothing to show
        if (!selectedTxFee || !selectedServiceFee) {
            return this.renderLoading();
        }

        return (
            <View style={containerStyle}>
                <TouchableDebounce activeOpacity={0.8} style={AppStyles.row} onPress={this.showFeeSelectOverlay}>
                    <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                        <Text style={textStyle}>
                            {this.getNormalizedFee()} {NetworkService.getNativeAsset()}
                        </Text>
                        <Badge
                            label={Capitalize(selectedTxFee.type)}
                            size="small"
                            color={this.getFeeColor()}
                            labelStyle={styles.badgeLabel}
                        />
                    </View>
                    {availableFees && (
                        <Button
                            onPress={this.showFeeSelectOverlay}
                            style={styles.editButton}
                            roundedMini
                            iconSize={13}
                            light
                            icon="IconEdit"
                        />
                    )}
                </TouchableDebounce>
                {Number(feeHooks) > 0 && (
                    <View style={AppStyles.paddingTopSml}>
                        <InfoMessage
                            type="info"
                            label={Localize.t('global.hookFeeNotice', {
                                hookFee: this.getNormalizedHooksFee(),
                                nativeAsset: NetworkService.getNativeAsset(),
                            })}
                        />
                    </View>
                )}
                {selectedServiceFee?.note && (
                    <View style={AppStyles.paddingTopSml}>
                        <InfoMessage
                            type="info"
                            label={selectedServiceFee?.note || 'No note'}
                        />
                    </View>
                )}
            </View>
        );
    }
}

export default FeePicker;
