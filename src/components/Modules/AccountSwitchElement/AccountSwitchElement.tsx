import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { AppScreens } from '@common/constants';

import { AccountModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';

import { Icon, TouchableDebounce } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    discreet: boolean;
}

interface State {
    isSwitcherOpen: boolean;
}

/* Component ==================================================================== */
class AccountSwitchElement extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isSwitcherOpen: false,
        };
    }

    onSwitcherClose = () => {
        this.setState({
            isSwitcherOpen: false,
        });
    };

    onPress = () => {
        const { discreet } = this.props;

        // set the tracker flag to true
        this.setState({
            isSwitcherOpen: true,
        });

        // open the switcher overlay
        Navigator.showOverlay(AppScreens.Overlay.SwitchAccount, {
            discreetMode: discreet,
            onClose: this.onSwitcherClose,
        });
    };

    render() {
        const { account, discreet } = this.props;
        const { isSwitcherOpen } = this.state;

        return (
            <TouchableDebounce activeOpacity={0.7} onPress={this.onPress} style={styles.container}>
                <View style={AppStyles.flex1}>
                    <Text style={styles.accountLabelText} numberOfLines={1}>
                        {account.label}
                    </Text>
                    <Text
                        testID="account-address-text"
                        adjustsFontSizeToFit
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
