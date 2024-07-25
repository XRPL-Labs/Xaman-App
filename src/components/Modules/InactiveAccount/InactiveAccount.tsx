import React, { PureComponent } from 'react';
import { FlatList, Text, View } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AppConfig, AppScreens } from '@common/constants';

import { XAppOrigin } from '@common/libs/payload';

import { GetCardId } from '@common/utils/tangem';
import { Navigator } from '@common/helpers/navigator';

import { AccountModel } from '@store/models';
import { AccountRepository } from '@store/repositories';
import { AccountTypes } from '@store/types';

import { Button, Icon } from '@components/General';

import Localize from '@locale';

import { Props as XAppBrowserModalProps } from '@screens/Modal/XAppBrowser/types';

import RegularKeyItem from '@components/Modules/InactiveAccount/RegularKeyItem';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
}

interface State {
    regularKeyAccounts?: AccountModel[];
}
/* Component ==================================================================== */
class InactiveAccount extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            regularKeyAccounts: undefined,
        };
    }

    static getDerivedStateFromProps(nextProps: Props): Partial<State> | null {
        return {
            regularKeyAccounts: AccountRepository.getRegularKeys(nextProps.account?.address),
        };
    }

    openActivateAccountXApp = () => {
        const { account } = this.props;

        let params = {};

        // include card serial number if tangem card
        if (account.type === AccountTypes.Tangem) {
            params = { cid: GetCardId(account.additionalInfo!) };
        }

        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: AppConfig.xappIdentifiers.activateAccount,
                params,
                account,
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
            },
        );
    };

    renderRegularKeyItem = ({ item }: { item: AccountModel }) => {
        return <RegularKeyItem account={item} />;
    };

    renderRegularKeys = () => {
        const { regularKeyAccounts } = this.state;

        // no regular key account
        if (!regularKeyAccounts || regularKeyAccounts.length === 0) {
            return null;
        }

        return (
            <View style={styles.regularKeyContainer} testID="not-activated-account-container-regular-key">
                <View style={[AppStyles.row, AppStyles.gapExtraSml, AppStyles.paddingLeftSml]}>
                    <Icon name="IconKey" size={20} style={AppStyles.imgColorGreen} />
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreen]}>
                        {Localize.t('account.regularKeyFor')}
                    </Text>
                </View>
                <FlatList
                    data={regularKeyAccounts}
                    renderItem={this.renderRegularKeyItem}
                    keyExtractor={(item) => item.address}
                />
            </View>
        );
    };

    renderActivateAccount = () => {
        const { regularKeyAccounts } = this.state;

        return (
            <View style={styles.messageContainer} testID="not-activated-account-container">
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorRed]}>
                    {Localize.t('account.yourAccountIsNotActivated')}
                </Text>
                {regularKeyAccounts && regularKeyAccounts?.length > 0 && (
                    <Text style={[AppStyles.smalltext, AppStyles.textCenterAligned, AppStyles.colorRed]}>
                        {Localize.t('account.activateRegularKeyAccountWarning')}
                    </Text>
                )}

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
        return (
            <View style={AppStyles.flex1}>
                {this.renderRegularKeys()}
                {this.renderActivateAccount()}
            </View>
        );
    }
}

/* Export ==================================================================== */
export default InactiveAccount;
