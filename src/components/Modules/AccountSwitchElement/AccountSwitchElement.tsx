import React, { Component } from 'react';
import { Text, View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { AccountModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';

import { Icon, TouchableDebounce } from '@components/General';

import Locale from '@locale';

import { Props as SwitchAccountOverlayProps } from '@screens/Overlay/SwitchAccount/types';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    discreet?: boolean;
    onAccountSwitch?: (account: AccountModel) => void;
    onSwitcherClose?: () => void;
    showAddAccountButton?: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
}

interface State {
    isSwitcherOpen: boolean;
}

/* Component ==================================================================== */
class AccountSwitchElement extends Component<Props, State> {
    static defaultProps: {
        discreet: false;
        showAddButton: false;
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            isSwitcherOpen: false,
        };
    }

    onSwitcherClose = () => {
        const { onSwitcherClose } = this.props;

        this.setState(
            {
                isSwitcherOpen: false,
            },
            () => {
                if (typeof onSwitcherClose === 'function') {
                    onSwitcherClose();
                }
            },
        );
    };

    onPress = () => {
        const { onAccountSwitch, showAddAccountButton, discreet } = this.props;

        // set the tracker flag to true
        this.setState(
            {
                isSwitcherOpen: true,
            },
            () => {
                // open the switcher overlay
                Navigator.showOverlay<SwitchAccountOverlayProps>(AppScreens.Overlay.SwitchAccount, {
                    discreetMode: !!discreet,
                    showAddAccountButton: !!showAddAccountButton,
                    onClose: this.onSwitcherClose,
                    onSwitch: onAccountSwitch,
                });
            },
        );
    };

    render() {
        const { account, discreet, containerStyle } = this.props;
        const { isSwitcherOpen } = this.state;

        if (!account) {
            return (
                <View style={styles.container}>
                    <Text style={styles.accountLabelText} numberOfLines={1}>
                        {Locale.t('global.noAccountConfigured')}
                    </Text>
                </View>
            );
        }

        return (
            <TouchableDebounce activeOpacity={0.7} onPress={this.onPress} style={[styles.container, containerStyle]}>
                <View style={AppStyles.flex1}>
                    <Text style={styles.accountLabelText} numberOfLines={1}>
                        {account.label}
                    </Text>
                    <Text
                        testID="account-address-text"
                        numberOfLines={1}
                        style={[styles.accountAddressText, discreet && AppStyles.colorGrey]}
                    >
                        {discreet ? '••••••••••••••••••••••••••••••••' : account.address}
                    </Text>
                </View>
                <Icon
                    style={styles.iconChevron}
                    size={25}
                    name={isSwitcherOpen ? 'IconChevronUp' : 'IconChevronDown'}
                />
            </TouchableDebounce>
        );
    }
}

export default AccountSwitchElement;
