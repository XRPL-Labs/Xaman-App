/**
 * Select Account Overlay
 */

import { sortBy } from 'lodash';
import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, TouchableOpacity, Platform, ScrollView } from 'react-native';

import Interactable from 'react-native-interactable';
import LinearGradient from 'react-native-linear-gradient';

import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes, AppColors } from '@theme';
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

const BOUNDARY_HEIGHT = 50;
const ROW_ITEM_HEIGHT = AppSizes.scale(70);
/* Component ==================================================================== */
class SelectAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SelectAccount;

    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
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
            contentHeight: 0,
            paddingBottom: 0,
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);
        this.onDismiss = () => {};
    }

    componentDidMount() {
        const { accounts } = this.props;

        // accounts count or as 3 item height
        const count = accounts.length < 3 ? 3 : accounts.length;

        // calculate the overlay height
        const headerContentHeight = AppSizes.scale(33) + 90;

        const bottomGap = Platform.select({
            ios: 0,
            android: AppSizes.navigationBarHeight * 1.1,
        });

        let contentHeight = count * (ROW_ITEM_HEIGHT + 10) + bottomGap + headerContentHeight;

        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height * 0.9) {
            contentHeight = AppSizes.screen.height * 0.9;
            paddingBottom = ROW_ITEM_HEIGHT + bottomGap;
        }

        this.setState(
            {
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
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

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

    onCancelPress = () => {
        this.slideDown();
    };

    onSelect = (account: AccountSchema) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(account);
        }

        this.slideDown();
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
                <LinearGradient
                    key={account.address}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    colors={[AppColors.light, AppColors.white]}
                    style={[styles.accountRowContainer, { height: ROW_ITEM_HEIGHT }]}
                >
                    <View style={[styles.accountRow]}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={[styles.accountLabel]}>{account.label}</Text>
                            <Text style={[styles.accountAddress]}>{account.address}</Text>
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
                </LinearGradient>
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
                    boundaries={{
                        top: AppSizes.screen.height - (contentHeight + BOUNDARY_HEIGHT),
                    }}
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
                                <Text style={[AppStyles.h5]}>{Localize.t('account.myAccounts')}</Text>
                            </View>
                            <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                                <Button
                                    light
                                    roundedSmall
                                    isDisabled={false}
                                    onPress={this.onCancelPress}
                                    textStyle={[AppStyles.subtext, AppStyles.bold]}
                                    label={Localize.t('global.cancel')}
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
export default SelectAccountOverlay;
