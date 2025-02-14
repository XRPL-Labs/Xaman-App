import { find, debounce } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ViewStyle, InteractionManager, TextStyle } from 'react-native';

import NetworkService from '@services/NetworkService';
import BackendService from '@services/BackendService';

import { AmountParser } from '@common/libs/ledger/parser/common';

import { TouchableDebounce, LoadingIndicator, InfoMessage } from '@components/General';

import Localize from '@locale';

import { FeeItem } from '@screens/Overlay/SelectFee/types';

import { AppStyles } from '@theme';

/**
 * This module is ONLY loaded on a SIGN REQUEST with a FIXED payload
 * where the service fee must be separately rendered. In all other
 * occasions, the Service Fee is part of the REGULAR FEE PICKER.
 */

/* Types ==================================================================== */
interface Props {
    txJson: any;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    showHooksFee?: boolean;
    onSelect?: (item: any) => void;
}

interface State {
    availableFees?: FeeItem[];
    selected?: FeeItem;
    feeHooks?: number;
    feePercentage?: number;
    error: boolean;
}

/* Component ==================================================================== */
class ServiceFee extends Component<Props, State> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof ServiceFee.defaultProps>>;

    static defaultProps: Partial<Props> = {
        showHooksFee: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            // availableFees: undefined,
            selected: undefined,
            feeHooks: undefined,
            feePercentage: undefined,
            error: false,
        };
    }

    // We don't update anymore, there's nothing that can
    // change now that will change the fee. Amounts. etc.
    // are already known here.
    // componentDidUpdate(prevProps: Readonly<Props>) {
    //     const { txJson } = this.props;
    //     // re-fetch the fees when received new transaction json
    //     if (!isEqual(omit(txJson, 'Fee'), omit(prevProps.txJson, 'Fee'))) {
    //         this.setState(
    //             {
    //                 // availableFees: undefined,
    //                 selected: undefined,
    //                 feeHooks: undefined,
    //                 error: false,
    //             },
    //             this.fetchFees,
    //         );
    //     }
    // }

    componentDidMount() {
        // fetch available fees from network
        InteractionManager.runAfterInteractions(this.fetchFees);
    }

    fetchFees = (isFallback = false): Promise<void> => {
        const { txJson } = this.props;

        // when it's retry with fallback then we don't include txJson
        return BackendService.getServiceFee(!isFallback ? txJson : undefined)
            .then((res) => {
                // console.log('Picked backend service service fee', res);
                const { availableFees, feeHooks, suggested, feePercentage } = res;

                this.setState({
                    // availableFees,
                    feeHooks,
                    feePercentage,
                });

                // set the suggested fee by default
                this.onSelect(find(availableFees, { type: suggested })!);
            })
            .catch(() => {});
    };

    debouncedFetchFees = debounce(this.fetchFees, 300);

    onSelect = (item: FeeItem) => {
        const { onSelect } = this.props;

        this.setState(
            {
                selected: item,
            },
            () => {
                if (typeof onSelect === 'function') {
                    onSelect(item);
                }
            },
        );
    };

    getNormalizedFee = () => {
        const { selected } = this.state;

        if (!selected) {
            return 0;
        }

        return new AmountParser(selected.value).dropsToNative().toString();
    };

    getNormalizedFeePercentage = () => {
        const { feePercentage } = this.state;

        if (!feePercentage) {
            return 0;
        }

        return feePercentage;
    };

    getNormalizedHooksFee = () => {
        const { feeHooks } = this.state;

        if (!feeHooks) {
            return 0;
        }

        return new AmountParser(feeHooks).dropsToNative().toString();
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
        const { selected, error } = this.state;

        if (error) {
            return this.renderError();
        }

        // nothing to show
        if (!selected) {
            return this.renderLoading();
        }

        return (
            <View style={containerStyle}>
                <TouchableDebounce activeOpacity={0.8} style={AppStyles.row}>
                    <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                        {
                            (
                                String(this.getNormalizedFeePercentage()) === '0' &&
                                String(this.getNormalizedFee()) === '0'
                            ) && (
                                <Text style={textStyle}>{Localize.t('global.none')}</Text>
                            )
                        }
                        {
                            (
                                String(this.getNormalizedFeePercentage()) !== '0'
                            ) && (
                                <Text style={textStyle}>
                                    {this.getNormalizedFeePercentage()}%
                                </Text>
                            )
                        }
                        {
                            (
                                String(this.getNormalizedFeePercentage()) === '0' &&
                                String(this.getNormalizedFee()) !== '0'
                            ) && (
                                <Text style={textStyle}>
                                    {this.getNormalizedFee()}{' '}
                                    {NetworkService.getNativeAsset()}
                                </Text>
                            )
                        }
                    </View>
                </TouchableDebounce>
                {selected?.note && (
                    <View style={AppStyles.paddingTopSml}>
                        <InfoMessage
                            type="info"
                            label={selected?.note || 'No note'}
                        />
                    </View>
                )}
            </View>
        );
    }
}

export default ServiceFee;
