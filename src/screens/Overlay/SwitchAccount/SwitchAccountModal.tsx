/**
 * Switch Account Overlay
 */

import { Results } from 'realm';
import { find } from 'lodash';

import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, TouchableOpacity, Platform, ScrollView } from 'react-native';

import Interactable from 'react-native-interactable';

import { AccessLevels } from '@store/types';
import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { Images } from '@common/helpers/images';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Icon } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
    signableAccount: Array<AccountSchema>;
    contentHeight: number;
    paddingBottom: number;
}

const BOUNDARY_HEIGHT = 50;
const ROW_ITEM_HEIGHT = AppSizes.scale(80);
/* Component ==================================================================== */
class SwitchAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchAccount;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    isOpening: boolean;

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

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.isOpening = true;
    }

    componentDidMount() {
        const accounts = AccountRepository.getAccounts({ hidden: false }).sorted([['order', false]]);
        const signableAccount = AccountRepository.getSignableAccounts();

        // accounts count or as 3 item height
        const count = accounts.length < 3 ? 3 : accounts.length;

        // calculate the overlay height
        const headerContentHeight = AppSizes.scale(33) + 90;

        const bottomGap = Platform.select({
            ios: 0,
            android: AppSizes.navigationBarHeight,
        });

        let contentHeight = count * (ROW_ITEM_HEIGHT + 10) + bottomGap + headerContentHeight;

        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height * 0.9) {
            contentHeight = AppSizes.screen.height * 0.9;
            paddingBottom = ROW_ITEM_HEIGHT + bottomGap;
        }

        this.setState(
            {
                accounts,
                signableAccount,
                contentHeight,
                paddingBottom,
            },
            () => {
                this.slideUp();
            },
        );
    }

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 10);
    };

    onAlert = (event: any) => {
        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            Navigator.dismissOverlay();
        }
    };

    onAddPressed = () => {
        if (Platform.OS === 'ios') {
            this.slideDown();
            setTimeout(() => {
                Navigator.push(AppScreens.Account.Add);
            }, 300);
        } else {
            Navigator.dismissOverlay();
            setTimeout(() => {
                Navigator.push(AppScreens.Account.Add);
            }, 100);
        }
    };

    changeDefaultAccount = (address: string) => {
        AccountRepository.setDefaultAccount(address);
        this.slideDown();
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
                                {account.address}
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
            <TouchableOpacity
                key={account.address}
                onPress={() => {
                    this.changeDefaultAccount(account.address);
                }}
                activeOpacity={0.9}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow, { height: ROW_ITEM_HEIGHT }]}>
                    <View style={[AppStyles.flex3]}>
                        <Text style={[styles.accountLabel]}>{account.label}</Text>
                        <Text style={[styles.accountAddress]}>{account.address}</Text>
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
            </TouchableOpacity>
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

        if (!accounts) return null;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={[{ y: AppSizes.screen.height + 3 }, { y: AppSizes.screen.height - contentHeight }]}
                    boundaries={{
                        top: AppSizes.screen.height - (contentHeight + BOUNDARY_HEIGHT),
                    }}
                    alertAreas={[
                        { id: 'bottom', influenceArea: { bottom: AppSizes.screen.height } },
                        { id: 'top', influenceArea: { top: AppSizes.screen.height - contentHeight } },
                    ]}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View style={[styles.visibleContent, { height: contentHeight + BOUNDARY_HEIGHT }]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

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
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchAccountOverlay;
