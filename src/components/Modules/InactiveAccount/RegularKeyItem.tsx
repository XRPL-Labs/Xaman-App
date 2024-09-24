import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { AccountModel } from '@store/models';
import { CoreRepository } from '@store/repositories';

import { Icon, TouchableDebounce } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    account: AccountModel;
}

interface State {}
/* Component ==================================================================== */
class RegularKeyItem extends PureComponent<Props, State> {
    switchToRegularKey = () => {
        const { account } = this.props;

        CoreRepository.setDefaultAccount(account);
    };

    render() {
        const { account } = this.props;

        return (
            <TouchableDebounce
                style={[AppStyles.row, AppStyles.centerAligned, styles.regularAccountItem]}
                onPress={this.switchToRegularKey}
                activeOpacity={0.9}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <Icon size={20} style={styles.iconAccount} name="IconAccount" />
                    <View>
                        <Text style={styles.regularItemLabel}>{account.label}</Text>
                        <Text style={styles.regularItemAddress}>{account.address}</Text>
                    </View>
                </View>
            </TouchableDebounce>
        );
    }
}

/* Export ==================================================================== */
export default RegularKeyItem;
