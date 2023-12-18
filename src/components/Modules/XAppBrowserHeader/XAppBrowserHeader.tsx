import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { AccountModel, NetworkModel } from '@store/models';

import { AccountSwitchElement } from '@components/Modules/AccountSwitchElement';
import { NetworkLabel } from '@components/Modules/NetworkLabel';
import { NetworkSwitchButton } from '@components/Modules/NetworkSwitchButton';
import { Button, Avatar, TextPlaceholder } from '@components/General';

import Localize from '@locale';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    identifier: string;
    title: string;
    icon: string;
    account: AccountModel;
    network: NetworkModel;
    onAccountChange?: (account: AccountModel) => void;
    onNetworkChange?: (network: any) => void;
    onClosePress?: () => void;
    onInfoPress?: () => void;
}

interface State {
    panelExpanded: boolean;
    isPanelExpanding: boolean;
}

/* Component ==================================================================== */
class XAppBrowserHeader extends Component<Props, State> {
    public static ExpandHeight = AppSizes.scale(100);
    private animatedExpand: Animated.Value;
    constructor(props: Props) {
        super(props);

        this.state = {
            panelExpanded: false,
            isPanelExpanding: false,
        };

        this.animatedExpand = new Animated.Value(0);
    }

    onDefaultAccountChange = (selectedAccount: AccountModel) => {
        const { account, onAccountChange } = this.props;

        // nothing has been changed
        if (selectedAccount.address === account.address) {
            return;
        }

        // callback
        if (typeof onAccountChange === 'function') {
            onAccountChange(selectedAccount);
        }
    };

    onNetworkChange = (network: NetworkModel) => {
        const { onNetworkChange } = this.props;

        if (typeof onNetworkChange === 'function') {
            onNetworkChange(network);
        }
    };

    showXAppInfo = () => {
        const { onInfoPress } = this.props;

        this.toggleExpandedBar();

        if (typeof onInfoPress === 'function') {
            onInfoPress();
        }
    };

    onClosePress = () => {
        const { onClosePress } = this.props;

        if (typeof onClosePress === 'function') {
            onClosePress();
        }
    };

    toggleExpandedBar = () => {
        const { panelExpanded, isPanelExpanding } = this.state;

        // debounce
        if (isPanelExpanding) {
            return;
        }

        this.setState({
            isPanelExpanding: true,
        });

        Animated.timing(this.animatedExpand, {
            toValue: panelExpanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            this.setState({
                panelExpanded: !panelExpanded,
                isPanelExpanding: false,
            });
        });
    };

    render() {
        const { title, icon, account } = this.props;
        const { isPanelExpanding, panelExpanded } = this.state;

        return (
            <>
                <View style={[styles.headerContainer, { borderBottomWidth: +!isPanelExpanding && +!panelExpanded }]}>
                    <View style={styles.headerLeftContainer}>
                        <Avatar isLoading={!icon} source={{ uri: icon }} size={30} />
                        <TextPlaceholder isLoading={!title} style={styles.titleText} length={24}>
                            {title}
                        </TextPlaceholder>
                    </View>
                    <View style={styles.headerRightContainer}>
                        <Button
                            testID="expand-button"
                            numberOfLines={1}
                            roundedMini
                            light
                            style={styles.headerButton}
                            onPress={this.toggleExpandedBar}
                        >
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <NetworkLabel size={13} type="circle" onPress={this.toggleExpandedBar} />
                                <Text style={styles.headerButtonText}>•••</Text>
                            </View>
                        </Button>
                        <Button
                            contrast
                            testID="close-button"
                            numberOfLines={1}
                            roundedMini
                            icon="IconX"
                            iconSize={20}
                            style={[styles.headerButton, styles.headerButtonClose]}
                            onPress={this.onClosePress}
                        />
                    </View>
                </View>

                <Animated.View
                    style={[
                        styles.headerExpandedContainer,
                        {
                            height: this.animatedExpand.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, XAppBrowserHeader.ExpandHeight],
                            }),
                            transform: [
                                {
                                    translateY: this.animatedExpand.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-XAppBrowserHeader.ExpandHeight, 0],
                                    }),
                                },
                            ],
                            zIndex: +!isPanelExpanding,
                        },
                    ]}
                >
                    {/* First Row */}
                    <View style={styles.accountSwitchContainer}>
                        <AccountSwitchElement
                            account={account}
                            onAccountSwitch={this.onDefaultAccountChange}
                            onSwitcherClose={this.toggleExpandedBar}
                        />
                    </View>

                    {/* Second row */}
                    <View style={AppStyles.row}>
                        <Button
                            light
                            roundedSmallBlock
                            label={Localize.t('xapp.aboutThisXApp')}
                            onPress={this.showXAppInfo}
                            activeOpacity={0.8}
                            style={[AppStyles.flex1, styles.headerButton]}
                        />
                        <NetworkSwitchButton
                            containerStyle={[AppStyles.flex1, { marginLeft: AppSizes.paddingSml }]}
                            loadingAnimation={false}
                            showChevronIcon
                            height="100%"
                            onNetworkChange={this.onNetworkChange}
                            onSwitcherClose={this.toggleExpandedBar}
                        />
                    </View>
                </Animated.View>
            </>
        );
    }
}

export default XAppBrowserHeader;
