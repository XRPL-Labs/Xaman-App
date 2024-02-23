import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AppConfig, AppScreens } from '@common/constants';

import { XAppOrigin } from '@common/libs/payload';

import { GetCardId } from '@common/utils/tangem';
import { Navigator } from '@common/helpers/navigator';

import { AccountModel } from '@store/models';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountTypes } from '@store/types';

import { Button, Icon, InfoMessage, Spacer, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';
/* Types ==================================================================== */
interface Props {
    account: AccountModel;
}

interface State {}
/* Component ==================================================================== */
class InactiveAccount extends PureComponent<Props, State> {
    openActivateAccountXApp = () => {
        const { account } = this.props;

        let params = {};

        // include card serial number if tangem card
        if (account.type === AccountTypes.Tangem) {
            params = { cid: GetCardId(account.additionalInfo!) };
        }

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: AppConfig.xappIdentifiers.activateAccount,
                params,
                account,
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    switchToRegularKey = (account: AccountModel) => {
        CoreRepository.setDefaultAccount(account);
    };

    renderRegularKey = (accounts: AccountModel[]) => {
        return (
            <View style={[AppStyles.flex6, AppStyles.paddingHorizontalSml]}>
                <InfoMessage icon="IconKey" type="success" label={Localize.t('account.regularKeyFor')} />
                <Spacer />
                {accounts.map((account, index) => {
                    return (
                        <TouchableDebounce
                            key={index}
                            style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}
                            /* eslint-disable-next-line react/jsx-no-bind */
                            onPress={this.switchToRegularKey.bind(null, account)}
                            activeOpacity={0.9}
                        >
                            <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                                <Icon size={25} style={styles.iconAccount} name="IconAccount" />
                                <View>
                                    <Text style={AppStyles.pbold}>{account.label}</Text>
                                    <Text style={[AppStyles.subtext, AppStyles.mono, AppStyles.colorBlue]}>
                                        {account.address}
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

        const regularKeyAccounts = AccountRepository.getRegularKeys(account.address);

        if (Array.isArray(regularKeyAccounts) && regularKeyAccounts.length > 0) {
            return this.renderRegularKey(regularKeyAccounts);
        }

        return this.renderActivateAccount();
    }
}

/* Export ==================================================================== */
export default InactiveAccount;
