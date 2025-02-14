/**
 * Select Fee Overlay
 */
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { NetworkService } from '@services';

// components
import { ActionPanel, Button, Footer } from '@components/General';

import { FeeList } from '@components/Modules';
import FeeListItemStyles from '@components/Modules/FeeList/FeeListItem/styles';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { FeeItem, Props, State } from './types';

/* Component ==================================================================== */
class SelectFeeOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SelectFee;

    private actionPanelRef: React.RefObject<ActionPanel>;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedFee: props.selectedFee,
        };

        this.actionPanelRef = React.createRef();
    }

    onItemSelect = (item: FeeItem) => {
        this.setState({
            selectedFee: item,
        });
    };

    onApply = () => {
        const { onSelect } = this.props;
        const { selectedFee } = this.state;

        this.actionPanelRef?.current?.slideDown();

        setTimeout(() => {
            if (typeof onSelect === 'function') {
                onSelect(selectedFee);
            }
        }, 200);
    };

    onClosePress = () => {
        this.actionPanelRef?.current?.slideDown();
    };

    render() {
        const { availableFees, serviceFee } = this.props;
        const { selectedFee } = this.state;

        const normalizedSeviceFeeValue = new AmountParser(serviceFee?.value || 0).dropsToNative().toString();

        return (
            <ActionPanel
                ref={this.actionPanelRef}
                height={AppSizes.moderateScale(520)}
                onSlideDown={Navigator.dismissOverlay}
                contentStyle={AppStyles.centerAligned}
                extraBottomInset
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('events.fees')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.paddingRightSml, AppStyles.flexEnd]}>
                        <Button
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={this.onClosePress}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.close')}
                        />
                    </View>
                </View>
                <FeeList
                    containerStyle={[AppStyles.paddingVerticalSml, AppStyles.paddingHorizontalSml]}
                    items={availableFees}
                    onItemPress={this.onItemSelect}
                    selectedItem={selectedFee}
                />
                <View style={[
                    AppStyles.row,
                    styles.serviceFeeItem,
                ]}>
                    <View style={AppStyles.flex3}>
                        <Text style={[FeeListItemStyles.label]}>{Localize.t('events.serviceFee')}</Text>
                    </View>
                    <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                        <Text style={[FeeListItemStyles.value, AppStyles.textRightAligned]}>
                            { normalizedSeviceFeeValue } {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
                <Footer style={styles.footer}>
                    <Button numberOfLines={1} label={Localize.t('global.apply')} onPress={this.onApply} />
                </Footer>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default SelectFeeOverlay;
