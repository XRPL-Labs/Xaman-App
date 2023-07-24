import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Truncate } from '@common/utils/string';

import { AccountRepository } from '@store/repositories';
import { AccountModel, NetworkModel } from '@store/models';

import { TouchableDebounce, Button, Avatar, Icon } from '@components/General';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    xappTitle: string;
    xappIcon: string;
    account: AccountModel;
    network: NetworkModel;

    onAccountChange?: (account: AccountModel) => void;
    onNetworkChange?: (network: any) => void;
    onClosePress?: () => void;
}

interface State {
    panelExpanded: boolean;
}

/* Component ==================================================================== */
class XAppBrowserHeader extends Component<Props, State> {
    private animatedExpand: Animated.Value;
    constructor(props: Props) {
        super(props);

        this.state = {
            panelExpanded: false,
        };

        this.animatedExpand = new Animated.Value(0);
    }

    onAccountSelect = (selectedAccount: AccountModel) => {
        const { account, onAccountChange } = this.props;

        // toggle expanded bar
        this.toggleExpandedBar();

        // nothing has been changed
        if (selectedAccount.address === account.address) {
            return;
        }

        if (typeof onAccountChange === 'function') {
            onAccountChange(selectedAccount);
        }
    };

    onNetworkChange = (network: NetworkModel) => {
        const { onNetworkChange } = this.props;

        // toggle expanded bar
        this.toggleExpandedBar();

        if (typeof onNetworkChange === 'function') {
            onNetworkChange(network);
        }
    };

    showAccountSelect = () => {
        const { account } = this.props;

        Navigator.showOverlay(AppScreens.Overlay.SelectAccount, {
            selected: account,
            accounts: AccountRepository.getAccounts(),
            onSelect: this.onAccountSelect,
        });
    };

    showNetworkSwitcher = () => {
        Navigator.showOverlay(AppScreens.Overlay.SwitchNetwork, {
            onChangeNetwork: this.onNetworkChange,
        });
    };

    onClosePress = () => {
        const { onClosePress } = this.props;

        if (typeof onClosePress === 'function') {
            onClosePress();
        }
    };

    showXAppInfo = () => {
        // in progress
    };

    toggleExpandedBar = () => {
        const { panelExpanded } = this.state;
        Animated.timing(this.animatedExpand, {
            toValue: panelExpanded ? 0 : 1,
            duration: 300,
            useNativeDriver: false,
        }).start(() => {
            this.setState({
                panelExpanded: !panelExpanded,
            });
        });
    };

    render() {
        const { xappTitle, xappIcon, network, account } = this.props;

        return (
            <>
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeftContainer}>
                        <Avatar source={{ uri: xappIcon }} size={30} />
                        <Text numberOfLines={1} style={styles.titleText}>
                            {xappTitle || 'Loading...'}
                        </Text>
                    </View>
                    <View style={styles.headerRightContainer}>
                        <Button
                            testID="info-button"
                            numberOfLines={1}
                            roundedMini
                            light
                            icon="IconInfo"
                            iconSize={15}
                            style={styles.headerButton}
                            onPress={this.showXAppInfo}
                        />
                        <Button
                            testID="info-button"
                            numberOfLines={1}
                            roundedMini
                            light
                            icon="IconRadio"
                            iconSize={18}
                            style={styles.headerButton}
                            iconStyle={styles.networkIcon}
                            onPress={this.toggleExpandedBar}
                        />
                        <Button
                            contrast
                            testID="close-button"
                            numberOfLines={1}
                            roundedMini
                            icon="IconX"
                            iconSize={20}
                            style={styles.headerButton}
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
                                outputRange: [0, AppSizes.heightPercentageToDP(4)],
                            }),
                            transform: [
                                {
                                    translateY: this.animatedExpand.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-AppSizes.heightPercentageToDP(4), 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <TouchableDebounce
                        onPress={this.showNetworkSwitcher}
                        style={[
                            styles.expandableButton,
                            AppStyles.flex1,
                            AppStyles.flexStart,
                            AppStyles.marginRightSml,
                        ]}
                    >
                        <Icon name="IconRadio" size={18} style={AppStyles.imgColorGreen} />
                        <Text style={styles.networkText}>{network.name}</Text>
                        <Icon name="IconChevronDown" />
                    </TouchableDebounce>
                    <TouchableDebounce
                        onPress={this.showAccountSelect}
                        style={[styles.expandableButton, AppStyles.flex3, AppStyles.flexEnd]}
                    >
                        <Text style={styles.addressText}>{Truncate(account.address, 30)}</Text>
                        <Icon name="IconChevronDown" />
                    </TouchableDebounce>
                </Animated.View>
            </>
        );
    }
}

export default XAppBrowserHeader;
