/**
 * Switch Account Overlay
 */

import { Results } from 'realm';
import { find } from 'lodash';

import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, TouchableOpacity, Platform, ScrollView } from 'react-native';

import Interactable from 'react-native-interactable';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

import { getNavigationBarHeight } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Icon } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
    contentHeight: number;
    paddingBottom: number;
}

/* Component ==================================================================== */
class SwitchAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchAccount;

    panel: any;
    deltaY: Animated.Value;
    onDismiss: () => void;

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
            contentHeight: 0,
            paddingBottom: 0,
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.onDismiss = () => {};
    }

    componentDidMount() {
        const accounts = AccountRepository.getAccounts();

        let contentHeight = accounts.length * AppSizes.scale(60) + 150 + getNavigationBarHeight();

        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height - 150) {
            contentHeight = AppSizes.screen.height - 150;
            paddingBottom = AppSizes.scale(60);
        }

        if (contentHeight < 300) {
            contentHeight = 300;
        }

        this.setState(
            {
                accounts,
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

    onSnap = async (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
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

        return find(accounts, { regularKey: account.address });
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

        return accounts.map((account, index) => {
            if (account.default) {
                return (
                    <View
                        key={index}
                        style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow, styles.accountRowSelected]}
                    >
                        <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                            <Icon size={25} style={[styles.iconAccountActive]} name="IconAccount" />
                            <Text style={[AppStyles.pbold]}>{account.label}</Text>
                            {this.isRegularKey(account) && (
                                <View style={[styles.regularKey]}>
                                    <Icon size={12} style={[styles.iconKey]} name="IconKey" />
                                    <Text style={[styles.regularKeyText]}>REGULAR</Text>
                                </View>
                            )}
                        </View>
                        <View style={[AppStyles.flex1]}>
                            <View style={[styles.radioCircleSelected, AppStyles.rightSelf]} />
                        </View>
                        {/* <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, styles.selectedText]}>
                                {Localize.t('global.selected')}
                            </Text>
                        </View> */}
                    </View>
                );
            }
            return (
                <TouchableOpacity
                    key={index}
                    style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}
                    onPress={() => {
                        this.changeDefaultAccount(account.address);
                    }}
                    activeOpacity={0.9}
                >
                    <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                        <Icon size={25} style={[styles.iconAccount]} name="IconAccount" />
                        <Text style={[AppStyles.p]}>{account.label}</Text>
                        {this.isRegularKey(account) && (
                            <View style={[styles.regularKey]}>
                                <Icon size={12} style={[styles.iconKey]} name="IconKey" />
                                <Text style={[styles.regularKeyText]}>REGULAR</Text>
                            </View>
                        )}
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <View style={[styles.radioCircle, AppStyles.rightSelf]} />
                    </View>
                    {/* <View style={[AppStyles.flex1]}>
                        <Button
                            roundedSmall
                            label={Localize.t('global.switch')}
                            onPress={() => {
                                this.changeDefaultAccount(account.address);
                            }}
                            style={[AppStyles.buttonBlack, AppStyles.rightSelf]}
                            // textStyle={styles.switchButtonText}
                        />
                    </View> */}
                </TouchableOpacity>
            );
        });
    };

    render() {
        const { accounts, contentHeight, paddingBottom } = this.state;

        if (!accounts) return null;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.slideDown();
                    }}
                >
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
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[{ y: AppSizes.screen.height + 3 }, { y: AppSizes.screen.height - contentHeight }]}
                    boundaries={{ top: AppSizes.screen.height - (contentHeight + 50) }}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                >
                    <View style={[AppStyles.visibleContent]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                                <Text style={[AppStyles.h5]}>{Localize.t('account.myAccounts')}</Text>
                            </View>
                            <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                                <Button
                                    label={Localize.t('home.addAccount')}
                                    icon="IconPlus"
                                    iconStyle={[AppStyles.imgColorBlue]}
                                    roundedSmall
                                    light
                                    isDisabled={false}
                                    onPress={this.onAddPressed}
                                />
                            </View>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom }}>{this.renderContent()}</ScrollView>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchAccountOverlay;
