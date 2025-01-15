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

import Localize from '@locale';

import { FeeItem, Props as SelectFeeOverlayProps } from '@screens/Overlay/SelectFee/types';

import { AppStyles } from '@theme';
import styles from './styles';

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
            selected: undefined,
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
                    availableFees: undefined,
                    selected: undefined,
                    feeHooks: undefined,
                    error: false,
                },
                this.fetchFees,
            );
        }
    }

    componentDidMount() {
        // fetch available fees from network
        InteractionManager.runAfterInteractions(this.fetchFees);
    }

    fetchFees = (isFallback = false): Promise<void> => {
        const { txJson } = this.props;
        const { error } = this.state;

        // clear any error for retrying again
        if (error) {
            this.setState({
                error: false,
            });
        }

        // when it's retry with fallback then we don't include txJson
        return NetworkService.getAvailableNetworkFee(!isFallback ? txJson : undefined)
            .then((res) => {
                const { availableFees, feeHooks, suggested } = res;

                this.setState({
                    availableFees,
                    feeHooks,
                });

                // set the suggested fee by default
                this.onSelect(find(availableFees, { type: suggested })!);
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

    showFeeSelectOverlay = () => {
        const { availableFees, selected } = this.state;

        Navigator.showOverlay<SelectFeeOverlayProps>(AppScreens.Overlay.SelectFee, {
            availableFees: availableFees!,
            selectedFee: selected!,
            onSelect: this.onSelect,
        });
    };

    getNormalizedFee = () => {
        const { selected } = this.state;

        if (!selected) {
            return 0;
        }

        return new AmountParser(selected.value).dropsToNative().toString();
    };

    getNormalizedHooksFee = () => {
        const { feeHooks } = this.state;

        if (!feeHooks) {
            return 0;
        }

        return new AmountParser(feeHooks).dropsToNative().toString();
    };

    getFeeColor = () => {
        const { selected } = this.state;

        switch (selected?.type) {
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
        const { selected, availableFees, feeHooks, error } = this.state;

        // error while fetching the fee
        //  give the user ability to retry
        if (error) {
            return this.renderError();
        }

        // nothing to show
        if (!selected) {
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
                            label={Capitalize(selected.type)}
                            size="small"
                            color={this.getFeeColor()}
                            labelStyle={styles.badgeLabel}
                        />
                    </View>
                    {availableFees && (
                        <Button
                            onPress={this.showFeeSelectOverlay}
                            style={styles.editButton}
                            roundedSmall
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
            </View>
        );
    }
}

export default FeePicker;
