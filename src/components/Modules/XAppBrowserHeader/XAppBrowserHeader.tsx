import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Truncate } from '@common/utils/string';

import { AccountRepository } from '@store/repositories';
import { AccountModel, NetworkModel } from '@store/models';

import { AppSizes, AppStyles } from '@theme';
import { TouchableDebounce, Button, Avatar, Icon, TextPlaceholder } from '@components/General';

import Localize from '@locale';

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

        // no account is configured in xumm
        if (!account) {
            return;
        }

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

    showXAppInfo = () => {
        const { onInfoPress } = this.props;

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
        const { title, icon, network, account } = this.props;

        return (
            <>
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeftContainer}>
                        <Avatar isLoading={!icon} source={{ uri: icon }} size={30} />
                        <TextPlaceholder isLoading={!title} style={styles.titleText} length={24}>
                            {title}
                        </TextPlaceholder>
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
                        activeOpacity={0.8}
                        style={[
                            styles.expandableButton,
                            AppStyles.flex1,
                            AppStyles.flexStart,
                            AppStyles.marginRightSml,
                        ]}
                    >
                        <Icon name="IconRadio" size={18} style={AppStyles.imgColorGreen} />
                        <Text style={styles.networkText}>{network.name}</Text>
                        <Icon name="IconChevronDown" size={22} style={styles.iconChevronDown} />
                    </TouchableDebounce>
                    <TouchableDebounce
                        activeOpacity={0.8}
                        onPress={this.showAccountSelect}
                        style={[styles.expandableButton, AppStyles.flex3, AppStyles.flexEnd]}
                    >
                        <Text numberOfLines={1} style={[styles.addressText, !account && styles.addressTextDisabled]}>
                            {account ? Truncate(account.address, 30) : Localize.t('global.noAccountConfigured')}
                        </Text>
                        <Icon
                            name="IconChevronDown"
                            size={22}
                            style={[styles.iconChevronDown, !account && styles.iconChevronDownDisabled]}
                        />
                    </TouchableDebounce>
                </Animated.View>
            </>
        );
    }
}

export default XAppBrowserHeader;
