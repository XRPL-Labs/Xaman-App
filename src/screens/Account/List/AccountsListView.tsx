/**
 * Accounts List Screen
 */

import { find } from 'lodash';
import Realm from 'realm';

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, InteractionManager } from 'react-native';

import { Navigation } from 'react-native-navigation';

import Vault from '@common/libs/vault';

import { AppScreens } from '@common/constants';

// helpers
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

// store

import { AccountRepository } from '@store/repositories';
import { AccountModel } from '@store/models';
import { AccessLevels, EncryptionLevels } from '@store/types';

import StyleService from '@services/StyleService';

// components
import { Button, Icon, Header, SortableFlatList, Spacer } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Realm.Results<AccountModel>;
    dataSource: any;
    signableAccount: Array<AccountModel>;
    reorderEnabled: boolean;
    isMigrationRequired: boolean;
}

/* Component ==================================================================== */
class AccountListView extends Component<Props, State> {
    static screenName = AppScreens.Account.List;

    private navigationListener: any;

    static options() {
        return {
            topBar: { visible: false },
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const accounts = AccountRepository.getAccounts().sorted([['order', false]]);

        this.state = {
            accounts,
            dataSource: accounts,
            signableAccount: AccountRepository.getSignableAccounts(),
            reorderEnabled: false,
            isMigrationRequired: false,
        };
    }

    componentDidMount() {
        this.navigationListener = Navigation.events().bindComponent(this);

        InteractionManager.runAfterInteractions(this.checkMigrationRequired);
    }

    componentWillUnmount() {
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        InteractionManager.runAfterInteractions(() => {
            this.loadAccounts();
            this.checkMigrationRequired();
        });
    }

    loadAccounts = () => {
        const accounts = AccountRepository.getAccounts().sorted([['order', false]]);

        this.setState({
            accounts,
            dataSource: accounts,
            signableAccount: AccountRepository.getSignableAccounts(),
        });
    };

    checkMigrationRequired = () => {
        const { accounts } = this.state;

        let isMigrationRequired = false;

        // get latest cipher version from vault module
        const latestVaultCipherVersion = Vault.getLatestCipherVersion();

        // check if any of the accounts needs encryption migrations
        for (const account of accounts) {
            if ([EncryptionLevels.Passcode, EncryptionLevels.Passphrase].includes(account.encryptionLevel)) {
                if (account.encryptionVersion < latestVaultCipherVersion) {
                    isMigrationRequired = true;
                    break;
                }
            }
        }

        this.setState({
            isMigrationRequired,
        });
    };

    onItemPress = (account: AccountModel) => {
        const { reorderEnabled } = this.state;

        if (!account?.isValid()) {
            return;
        }

        if (!reorderEnabled) {
            Navigator.push(AppScreens.Account.Edit.Settings, { account });
        }
    };

    isRegularKey = (account: AccountModel) => {
        const { accounts } = this.state;

        const found = find(accounts, { regularKey: account.address });

        if (found) {
            return found.label;
        }

        return false;
    };

    onAccountReorder = (data: Array<AccountModel>) => {
        this.setState({
            dataSource: data,
        });

        for (let i = 0; i < data.length; i++) {
            if (data[i].address) {
                AccountRepository.update({
                    address: data[i].address,
                    order: i,
                });
            }
        }
    };

    toggleReorder = () => {
        const { reorderEnabled } = this.state;

        this.setState({
            reorderEnabled: !reorderEnabled,
        });
    };

    itemKeyExtractor = (item: AccountModel, index: number) => {
        return item?.isValid() ? `account-${item.address}` : `account-${index}`;
    };

    renderItem = ({ item }: { item: AccountModel }) => {
        const { signableAccount, reorderEnabled } = this.state;

        if (!item?.isValid()) return null;

        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        const signable = find(signableAccount, { address: item.address });

        if (!signable) {
            // if master key is disabled then show it in the label
            if (item.flags?.disableMasterKey) {
                accessLevelLabel = `${Localize.t('account.readOnly')} (${Localize.t('account.masterKeyDisabled')}) `;
            } else {
                accessLevelLabel = Localize.t('account.readOnly');
            }

            accessLevelIcon = 'IconLock';
        }

        // promoted by regular key
        if (item.accessLevel === AccessLevels.Readonly && signable) {
            accessLevelIcon = 'IconKey';
        }

        const regularKeyFor = this.isRegularKey(item);

        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} ${regularKeyFor}`;
            accessLevelIcon = 'IconKey';
        }

        return (
            <View style={styles.rowContainer}>
                <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                    <View style={AppStyles.flex6}>
                        <Text numberOfLines={1} style={styles.accountLabel}>
                            {item.label}
                        </Text>
                        <View style={styles.accessLevelContainer}>
                            <Icon size={13} name={accessLevelIcon} style={AppStyles.imgColorGrey} />
                            <Text numberOfLines={1} style={styles.accessLevelLabel}>
                                {accessLevelLabel}
                            </Text>
                            {item.hidden && (
                                <>
                                    <Text style={styles.accessLevelLabel}> </Text>
                                    <Icon size={13} name="IconEyeOff" style={AppStyles.imgColorGrey} />
                                    <Text style={styles.accessLevelLabel}>{Localize.t('global.hidden')}</Text>
                                </>
                            )}
                        </View>
                    </View>
                    <View style={AppStyles.flex2}>
                        {reorderEnabled ? (
                            <View style={AppStyles.rightAligned}>
                                <Icon size={20} name="IconReorderHandle" style={AppStyles.imgColorGrey} />
                            </View>
                        ) : (
                            <Button
                                light
                                roundedSmall
                                icon="IconEdit"
                                iconStyle={styles.rowIcon}
                                iconSize={15}
                                textStyle={styles.buttonEditText}
                                label={Localize.t('global.edit')}
                                onPress={() => {
                                    this.onItemPress(item);
                                }}
                            />
                        )}
                    </View>
                </View>
                <View style={[AppStyles.row, styles.subRow]}>
                    <View style={AppStyles.flex1}>
                        <Text style={[AppStyles.monoBold, AppStyles.colorGrey, styles.subLabel]}>
                            {Localize.t('global.address')}:
                        </Text>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { accounts, dataSource, reorderEnabled, isMigrationRequired } = this.state;

        return (
            <View testID="accounts-list-screen" style={AppStyles.container}>
                <Header
                    centerComponent={{ text: Localize.t('global.accounts') }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        testID: 'back-button',
                        onPress: Navigator.pop,
                    }}
                    rightComponent={
                        accounts.isEmpty()
                            ? {
                                  icon: 'IconPlus',
                                  testID: 'add-account-button',
                                  onPress: () => {
                                      Navigator.push(AppScreens.Account.Add);
                                  },
                              }
                            : {
                                  icon: reorderEnabled ? 'IconCheck' : 'IconReorder',
                                  iconSize: reorderEnabled ? 26 : 30,
                                  testID: 'reorder-toggle-button',
                                  onPress: this.toggleReorder,
                              }
                    }
                />

                {accounts.isEmpty() ? (
                    <ImageBackground
                        source={StyleService.getImage('BackgroundShapes')}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.contentContainer, AppStyles.padding]}
                    >
                        <Image style={AppStyles.emptyIcon} source={StyleService.getImage('ImageFirstAccount')} />
                        <Text style={AppStyles.emptyText}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
                        <Button
                            label={Localize.t('home.addAccount')}
                            icon="IconPlus"
                            iconStyle={AppStyles.imgColorWhite}
                            rounded
                            onPress={() => {
                                Navigator.push(AppScreens.Account.Add);
                            }}
                        />
                    </ImageBackground>
                ) : (
                    <View style={AppStyles.flex1}>
                        {isMigrationRequired && !reorderEnabled ? (
                            <View style={styles.rowMigrationContainer}>
                                <Text style={[AppStyles.subtext, AppStyles.bold]}>
                                    {Localize.t('account.newEncryptionMethodAvailable')}
                                </Text>
                                <Spacer />
                                <Text style={AppStyles.subtext}>
                                    {Localize.t('account.checkWhichAccountsNeedBetterEncryption')}
                                </Text>
                                <Spacer size={20} />
                                <Button
                                    testID="add-account-button"
                                    label={Localize.t('account.updateEncryption')}
                                    icon="IconChevronRight"
                                    iconPosition="right"
                                    roundedSmall
                                    onPress={() => {
                                        Navigator.push(AppScreens.Account.Migration.CipherMigration);
                                    }}
                                />
                            </View>
                        ) : reorderEnabled ? (
                            <View style={styles.rowAddContainer}>
                                <View style={AppStyles.paddingHorizontalSml}>
                                    <Text
                                        adjustsFontSizeToFit
                                        numberOfLines={2}
                                        style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}
                                    >
                                        {Localize.t('account.tapAndHoldToReorder')}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.rowAddContainer}>
                                <Button
                                    testID="add-account-button"
                                    label={Localize.t('home.addAccount')}
                                    icon="IconPlus"
                                    roundedSmall
                                    secondary
                                    onPress={() => {
                                        Navigator.push(AppScreens.Account.Add);
                                    }}
                                />
                            </View>
                        )}

                        <SortableFlatList
                            testID="account-list-scroll"
                            itemHeight={styles.rowContainer.height}
                            separatorHeight={10}
                            dataSource={dataSource}
                            keyExtractor={this.itemKeyExtractor}
                            renderItem={this.renderItem}
                            onDataChange={this.onAccountReorder}
                            onItemPress={this.onItemPress}
                            sortable={reorderEnabled}
                        />
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountListView;
