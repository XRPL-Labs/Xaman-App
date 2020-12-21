/**
 * Accounts List Screen
 */

import { find } from 'lodash';
import { Results } from 'realm';

import React, { Component } from 'react';
import { View, Text, FlatList, TouchableHighlight, Image, ImageBackground } from 'react-native';

import { Navigation } from 'react-native-navigation';

// helpers
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

// store
import { AccessLevels } from '@store/types';
import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// components
import { Button, Icon, Header } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
    signableAccount: Array<AccountSchema>;
}

/* Component ==================================================================== */
class AccountListView extends Component<Props, State> {
    static screenName = AppScreens.Account.List;

    static options() {
        return {
            topBar: { visible: false },
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: AccountRepository.getAccounts(),
            signableAccount: AccountRepository.getSignableAccounts(),
        };

        Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        this.setState({
            accounts: AccountRepository.getAccounts(),
            signableAccount: AccountRepository.getSignableAccounts(),
        });
    }

    onItemPress = (account: AccountSchema) => {
        Navigator.push(AppScreens.Account.Edit.Settings, {}, { account });
    };

    isRegularKey = (account: AccountSchema) => {
        const { accounts } = this.state;

        const found = find(accounts, { regularKey: account.address });

        if (found) {
            return found.label;
        }

        return false;
    };

    renderItem = (account: { item: AccountSchema; index: number }) => {
        const { signableAccount } = this.state;
        const { item } = account;

        if (!item?.isValid()) return null;

        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        const signable = find(signableAccount, { address: item.address });

        if (!signable) {
            accessLevelLabel = Localize.t('account.readOnly');
            accessLevelIcon = 'IconLock';
        }

        // promoted by regular key
        if (item.accessLevel === AccessLevels.Readonly && signable) {
            accessLevelIcon = 'IconKey';
        }

        const regularKeyFor = this.isRegularKey(item);

        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} (${regularKeyFor})`;
            accessLevelIcon = 'IconKey';
        }

        return (
            <TouchableHighlight
                testID={`account-${item.address}`}
                style={[styles.touchRow]}
                onPress={() => {
                    this.onItemPress(item);
                }}
                underlayColor="rgba(248, 250, 253, 1)"
            >
                <>
                    <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                        <View style={[AppStyles.flex6, AppStyles.row]}>
                            <View style={[AppStyles.flex1]}>
                                <Text style={[styles.accountLabel]}>{item.label}</Text>
                                <View style={[styles.accessLevelContainer]}>
                                    <Icon size={13} name={accessLevelIcon} style={AppStyles.imgColorGreyDark} />
                                    <Text style={[styles.accessLevelLabel, AppStyles.colorBlack]}>
                                        {accessLevelLabel}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={[AppStyles.flex2]}>
                            <Button
                                light
                                roundedSmall
                                icon="IconEdit"
                                iconStyle={styles.rowIcon}
                                iconSize={15}
                                textStyle={styles.rowText}
                                label={Localize.t('global.edit')}
                                onPress={() => {
                                    this.onItemPress(item);
                                }}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.row, styles.subRow]}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={[AppStyles.monoBold, AppStyles.colorGreyDark, styles.subLabel]}>
                                {Localize.t('global.address')}:
                            </Text>
                            <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                        </View>
                    </View>
                </>
            </TouchableHighlight>
        );
    };

    render() {
        const { accounts } = this.state;

        return (
            <View testID="accounts-list-screen" style={[AppStyles.container]}>
                <Header
                    centerComponent={{ text: Localize.t('global.accounts') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        testID: 'back-button',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    rightComponent={{
                        icon: 'IconPlus',
                        testID: 'add-account-button',
                        onPress: () => {
                            Navigator.push(AppScreens.Account.Add);
                        },
                    }}
                />

                {accounts.isEmpty() ? (
                    <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                        <ImageBackground
                            source={Images.BackgroundShapes}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={Images.ImageFirstAccount} />
                            <Text style={[AppStyles.emptyText]}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
                            <Button
                                label={Localize.t('home.addAccount')}
                                icon="IconPlus"
                                iconStyle={[AppStyles.imgColorWhite]}
                                rounded
                                onPress={() => {
                                    Navigator.push(AppScreens.Account.Add);
                                }}
                            />
                        </ImageBackground>
                    </View>
                ) : (
                    <View style={[AppStyles.contentContainer]}>
                        <FlatList
                            testID="account-list-scroll"
                            data={accounts}
                            renderItem={this.renderItem}
                            keyExtractor={(a) => a.address}
                        />
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountListView;
