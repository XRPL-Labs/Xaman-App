/**
 * Switch Account Overlay
 */

import { Results } from 'realm';
import { find } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { AccessLevels } from '@store/types';
import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { Images } from '@common/helpers/images';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { TouchableDebounce, Button, Icon, ActionPanel } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    discreetMode: boolean;
}

export interface State {
    accounts: Results<AccountSchema>;
    signableAccount: Array<AccountSchema>;
    contentHeight: number;
    paddingBottom: number;
}

const ROW_ITEM_HEIGHT = AppSizes.scale(80);
/* Component ==================================================================== */
class SwitchAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchAccount;

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
            accounts: undefined,
            signableAccount: undefined,
            contentHeight: 0,
            paddingBottom: 0,
        };
    }

    componentDidMount() {
        const accounts = AccountRepository.getAccounts({ hidden: false }).sorted([['order', false]]);

        const signableAccount = AccountRepository.getSignableAccounts();

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
            accounts,
            signableAccount,
            contentHeight,
            paddingBottom,
        });
    }

    onAddPressed = () => {
        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }

        setTimeout(() => {
            Navigator.push(AppScreens.Account.Add);
        }, 300);
    };

    changeDefaultAccount = (address: string) => {
        AccountRepository.setDefaultAccount(address);

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }
    };

    isRegularKey = (account: AccountSchema) => {
        const { accounts } = this.state;

        const found = find(accounts, { regularKey: account.address });

        if (found) {
            return found.label;
        }

        return false;
    };

    renderRow = (account: AccountSchema) => {
        const { discreetMode } = this.props;
        const { signableAccount } = this.state;

        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        const signable = find(signableAccount, { address: account.address });

        if (!signable) {
            accessLevelLabel = Localize.t('account.readOnly');
            accessLevelIcon = 'IconLock';
        }

        // promoted by regular key
        if (account.accessLevel === AccessLevels.Readonly && signable) {
            accessLevelIcon = 'IconKey';
        }

        const regularKeyFor = this.isRegularKey(account);

        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} ${regularKeyFor}`;
            accessLevelIcon = 'IconKey';
        }

        if (account.default) {
            return (
                <View
                    key={account.address}
                    style={[
                        AppStyles.row,
                        AppStyles.centerAligned,
                        styles.accountRow,
                        styles.accountRowSelected,
                        { height: ROW_ITEM_HEIGHT },
                    ]}
                >
                    <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={[styles.accountLabel, styles.accountLabelSelected]}>{account.label}</Text>
                            <Text style={[styles.accountAddress, styles.accountAddressSelected]}>
                                {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                            </Text>
                            <View style={[styles.accessLevelBadge, styles.accessLevelBadgeSelected]}>
                                <Icon size={11} name={accessLevelIcon} style={[AppStyles.imgColorPrimary]} />
                                <Text style={[styles.accessLevelLabel, styles.accessLevelLabelSelected]}>
                                    {accessLevelLabel}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <View style={[styles.radioCircleSelected, AppStyles.rightSelf]} />
                    </View>
                </View>
            );
        }

        return (
            <TouchableDebounce
                key={account.address}
                onPress={() => {
                    this.changeDefaultAccount(account.address);
                }}
                activeOpacity={0.9}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow, { height: ROW_ITEM_HEIGHT }]}>
                    <View style={[AppStyles.flex3]}>
                        <Text style={[styles.accountLabel]}>{account.label}</Text>
                        <Text style={[styles.accountAddress]}>
                            {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                        </Text>
                        <View style={[styles.accessLevelBadge]}>
                            <Icon
                                size={11}
                                name={accessLevelIcon}
                                style={[AppStyles.imgColorPrimary, styles.accessLevelIcon]}
                            />
                            <Text style={[styles.accessLevelLabel]}>{accessLevelLabel}</Text>
                        </View>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <View style={[styles.radioCircle, AppStyles.rightSelf]} />
                    </View>
                </View>
            </TouchableDebounce>
        );
    };

    renderContent = () => {
        const { accounts } = this.state;

        if (accounts.length === 0) {
            return (
                <View style={[AppStyles.centerContent, AppStyles.centerAligned, AppStyles.paddingTop]}>
                    <Text style={[AppStyles.p, AppStyles.strong]}>{Localize.t('account.noAccountYet')}</Text>
                </View>
            );
        }

        return accounts.map((account) => {
            return this.renderRow(account);
        });
    };

    render() {
        const { accounts, contentHeight, paddingBottom } = this.state;

        if (!accounts || !contentHeight) return null;

        return (
            <ActionPanel
                height={contentHeight}
                onSlideDown={Navigator.dismissOverlay}
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
                            light
                            roundedSmall
                            label={Localize.t('home.addAccount')}
                            icon="IconPlus"
                            isDisabled={false}
                            onPress={this.onAddPressed}
                        />
                    </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom }}>
                    {this.renderContent()}
                </ScrollView>
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchAccountOverlay;
