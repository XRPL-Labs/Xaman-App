import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AppScreens } from '@common/constants';

import { XAppOrigin } from '@common/libs/payload';

import { GetCardId } from '@common/utils/tangem';
import { Navigator } from '@common/helpers/navigator';

import { AccountSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';
import { AccountTypes } from '@store/types';

import { Button, Icon, InfoMessage, Spacer, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    account: AccountSchema;
}

interface State {}
/* Component ==================================================================== */
class InactiveAccount extends PureComponent<Props, State> {
    openActivateAccountXApp = () => {
        const { account } = this.props;

        let params = {};

        // include card serial number if tangem card
        if (account.type === AccountTypes.Tangem) {
            params = { cid: GetCardId(account.additionalInfo) };
        }

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                account,
                params,
                identifier: 'xumm.activateacc',
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    renderRegularKey = () => {
        const { account } = this.props;

        const keysForAccounts = AccountRepository.findBy('regularKey', account.address);

        return (
            <View style={[AppStyles.flex6, AppStyles.paddingHorizontalSml]}>
                <InfoMessage icon="IconKey" type="info" label={Localize.t('account.regularKeyFor')} />
                <Spacer />
                {keysForAccounts.map((acc, index) => {
                    return (
                        <TouchableDebounce
                            key={index}
                            style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}
                            onPress={() => {
                                AccountRepository.setDefaultAccount(acc.address);
                            }}
                            activeOpacity={0.9}
                        >
                            <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                                <Icon size={25} style={[styles.iconAccount]} name="IconAccount" />
                                <View>
                                    <Text style={[AppStyles.pbold]}>{acc.label}</Text>
                                    <Text style={[AppStyles.subtext, AppStyles.mono, AppStyles.colorBlue]}>
                                        {acc.address}
                                    </Text>
                                </View>
                            </View>
                        </TouchableDebounce>
                    );
                })}
            </View>
        );
    };

    renderActivateAccount = () => {
        return (
            <View style={[AppStyles.flex6, AppStyles.paddingHorizontalSml]} testID="not-activated-account-container">
                <InfoMessage type="error" label={Localize.t('account.yourAccountIsNotActivated')} />
                <Button
                    roundedSmall
                    style={AppStyles.marginTopSml}
                    label={Localize.t('home.activateYourAccount')}
                    onPress={this.openActivateAccountXApp}
                />
            </View>
        );
    };

    render() {
        const { account } = this.props;

        const isRegularKey = AccountRepository.isRegularKey(account.address);

        if (isRegularKey) {
            return this.renderRegularKey();
        }

        return this.renderActivateAccount();
    }
}

export default InactiveAccount;
