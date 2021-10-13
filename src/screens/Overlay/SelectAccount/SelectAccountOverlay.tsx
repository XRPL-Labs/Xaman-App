/**
 * Select Account Overlay
 */

import { sortBy } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    accounts: Array<AccountSchema>;
    selected: AccountSchema;
    onSelect: (account: AccountSchema) => void;
    onClose: () => void;
}

export interface State {
    contentHeight: number;
    paddingBottom: number;
}

const ROW_ITEM_HEIGHT = AppSizes.scale(80);
/* Component ==================================================================== */
class SelectAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SelectAccount;

    private actionPanel: ActionPanel;

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
            contentHeight: 0,
            paddingBottom: 0,
        };
    }

    componentDidMount() {
        const { accounts } = this.props;

        // accounts count or as 3 item height
        const count = accounts.length < 3 ? 3 : accounts.length;

        // calculate the overlay height
        const headerContentHeight = AppSizes.scale(33) + 90;

        let contentHeight = count * (ROW_ITEM_HEIGHT + 10) + headerContentHeight;

        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height * 0.9) {
            contentHeight = AppSizes.screen.height * 0.9;
            paddingBottom = ROW_ITEM_HEIGHT;
        }

        this.setState({
            contentHeight,
            paddingBottom,
        });
    }

    onSelect = (account: AccountSchema) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(account);
        }

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }
    };

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissOverlay();
    };

    renderRow = (account: AccountSchema) => {
        const { selected } = this.props;

        const isSelected = account.address === selected.address;

        return (
            <TouchableOpacity
                key={account.address}
                onPress={() => {
                    this.onSelect(account);
                }}
                activeOpacity={0.9}
            >
                <View
                    key={account.address}
                    style={[
                        AppStyles.row,
                        AppStyles.centerAligned,
                        styles.accountRow,
                        isSelected && styles.accountRowSelected,
                        { height: ROW_ITEM_HEIGHT },
                    ]}
                >
                    <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={[styles.accountLabel, isSelected && styles.accountLabelSelected]}>
                                {account.label}
                            </Text>
                            <Text style={[styles.accountAddress, isSelected && styles.accountAddressSelected]}>
                                {account.address}
                            </Text>
                        </View>
                        <View style={[AppStyles.flex1]}>
                            <View
                                style={[
                                    isSelected ? styles.radioCircleSelected : styles.radioCircle,
                                    AppStyles.rightSelf,
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    renderContent = () => {
        const { accounts } = this.props;

        if (accounts.length === 0) {
            return (
                <View style={[AppStyles.centerContent, AppStyles.centerAligned, AppStyles.paddingTop]}>
                    <Text style={[AppStyles.p, AppStyles.strong]}>{Localize.t('account.noAccountYet')}</Text>
                </View>
            );
        }

        return sortBy(accounts, ['order'], [false]).map((account) => {
            return this.renderRow(account);
        });
    };

    render() {
        const { contentHeight, paddingBottom } = this.state;
        const { accounts } = this.props;

        if (!accounts || !contentHeight) return null;

        return (
            <ActionPanel
                height={contentHeight}
                onSlideDown={this.onClose}
                ref={(r) => {
                    this.actionPanel = r;
                }}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5]}>
                            {Localize.t('account.myAccounts')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                        <Button
                            numberOfLines={1}
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={() => {
                                this.actionPanel?.slideDown();
                            }}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.cancel')}
                        />
                    </View>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom }}>{this.renderContent()}</ScrollView>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default SelectAccountOverlay;
