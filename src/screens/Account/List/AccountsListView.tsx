/**
 * Accounts List Screen
 */

import { isEmpty } from 'lodash';
import { Results } from 'realm';

import React, { Component } from 'react';
import { View, Text, FlatList, TouchableHighlight, Image, ImageBackground } from 'react-native';

import { Navigation } from 'react-native-navigation';

// helpers
import { Navigator, Images } from '@common/helpers';
import { AppScreens } from '@common/constants';
// import Flag from '@common/libs/ledger/parser/common/flag';

// store
import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// components
import { Button, Icon, Header } from '@components';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
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
        };

        Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        this.setState({
            accounts: AccountRepository.getAccounts(),
        });
    }

    onItemPress = (account: AccountSchema) => {
        Navigator.push(AppScreens.Account.Edit.Settings, {}, { account });
    };

    // renderFlag = () => {};

    renderItem = (account: { item: AccountSchema }) => {
        const { item } = account;

        // const flags = new Flag('Account', item.flags).parse();

        return (
            <TouchableHighlight
                style={[styles.touchRow]}
                onPress={() => {
                    this.onItemPress(item);
                }}
                underlayColor="rgba(248, 250, 253, 1)"
            >
                <>
                    <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                        <View style={[AppStyles.flex6, AppStyles.row]}>
                            <Icon name="IconAccount" size={25} style={styles.accountIcon} />
                            <Text style={[AppStyles.p, AppStyles.bold, styles.rowHeaderText]}>{item.label}</Text>
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
                    {/* <View style={[AppStyles.row, styles.subRow]}>
                        {keys(flags).map(k => {
                            if (flags[k]) {
                                return (
                                    <View style={[styles.tag]}>
                                        <Text style={styles.tagText}>{k.toUpperCase()}</Text>
                                    </View>
                                );
                            }
                            return null;
                        })}
                    </View> */}
                </>
            </TouchableHighlight>
        );
    };

    render() {
        const { accounts } = this.state;

        return (
            <View testID="account-list-view" style={[AppStyles.pageContainerFull]}>
                <Header
                    centerComponent={{ text: Localize.t('global.accounts') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    rightComponent={{
                        icon: 'IconPlus',
                        onPress: () => {
                            Navigator.push(AppScreens.Account.Add);
                        },
                    }}
                />

                {isEmpty(accounts) ? (
                    <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                        <ImageBackground
                            source={Images.BackgroundShapes}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={Images.ImageFirstAccount} />
                            <Text style={[AppStyles.emptyText]}>
                                It’s a little bit empty here add your first account.
                            </Text>
                            <Button
                                testID="add-account-button"
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
                        <FlatList data={accounts} renderItem={this.renderItem} />
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountListView;
