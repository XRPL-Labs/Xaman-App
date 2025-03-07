/**
 * Accounts List Screen
 */

import { find } from 'lodash';
import Realm from 'realm';

import BackendService from '@services/BackendService';

import React, { Component } from 'react';
import { View, Text, Image, ImageBackground, InteractionManager } from 'react-native';

import { EventSubscription, Navigation } from 'react-native-navigation';

import Vault from '@common/libs/vault';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import { AccountRepository } from '@store/repositories';
import { AccountModel } from '@store/models';
import { AccessLevels, EncryptionLevels } from '@store/types';

import StyleService from '@services/StyleService';

import { Button, Icon, Header, SortableFlatList, Spacer, LoadingIndicator } from '@components/General';
import { ProBadge } from '@components/Modules';

import Localize from '@locale';

import { AccountAddViewProps } from '@screens/Account/Add';
import { CipherMigrationViewProps } from '@screens/Account/Migration/CipherMigration';
import { AccountSettingsViewProps } from '@screens/Account/Edit';

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
    fetchingPro: boolean;
    nativeAccountInfo?: XamanBackend.MultiAddressNativeInfoResponse;
    loadingAccountDetails: boolean;
    accountDetails: null | {
        [key: string]: {
            isRegularKeyFor: string | false;
            isSignable: boolean;
        };
    };
}

/* Component ==================================================================== */
class AccountListView extends Component<Props, State> {
    static screenName = AppScreens.Account.List;

    private navigationListener?: EventSubscription;

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
            fetchingPro: true,
            loadingAccountDetails: true,
            accountDetails: null,
        };
    }

    componentDidMount() {
        const { accounts } = this.state;
        this.navigationListener = Navigation.events().bindComponent(this);

        BackendService.getMultiAddressNativeInfo(accounts.map(a => a.address)).then(nativeAccountInfo => {
            this.setState({
                nativeAccountInfo,
                fetchingPro: false,
            });
        });

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

    getAccountDetails = () => {
        const { accounts, signableAccount } = this.state;
        const accountDetails = accounts.map(account => {
            const isRegularKeyFor = this.isRegularKey(account);
            const isSignable = find(signableAccount, { address: account.address });
            return {
                _key: account.address,
                isRegularKeyFor,
                isSignable,
            };
        }).reduce((acc, itm) => {
            Object.assign(acc, {
                [itm._key]: {
                    ...itm,
                    _key: undefined,
                },
            });
            return acc;
        }, {});
        this.setState({
            accountDetails,
            loadingAccountDetails: false,
        });
    };

    loadAccounts = () => {
        const accounts = AccountRepository.getAccounts().sorted([['order', false]]);

        this.setState({
            accounts,
            dataSource: accounts,
            signableAccount: AccountRepository.getSignableAccounts(),
        });

        this.getAccountDetails();
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
        const { reorderEnabled, nativeAccountInfo } = this.state;

        if (!account?.isValid()) {
            return;
        }

        if (!reorderEnabled) {
            Navigator.push<AccountSettingsViewProps>(AppScreens.Account.Edit.Settings, {
                account,
                nativeAccountInfo: nativeAccountInfo && nativeAccountInfo?.[account.address],
            });
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
        const {
            reorderEnabled,
            fetchingPro,
            nativeAccountInfo,
            accountDetails,
        } = this.state;

        if (!item?.isValid()) return null;

        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        // const signable = find(signableAccount, { address: item.address });
        const signable = accountDetails && accountDetails[item.address].isSignable;

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

        const regularKeyFor = accountDetails && accountDetails[item.address].isRegularKeyFor;

        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} ${regularKeyFor}`;
            accessLevelIcon = 'IconKey';
        }

        const hasPro = signable && nativeAccountInfo && nativeAccountInfo?.[item.address]?.hasPro;

        return (
            <View style={[
                styles.rowContainer,
                hasPro && styles.hasProBorder,
            ]}>
                <View style={[AppStyles.row, styles.rowHeader, AppStyles.centerContent]}>
                    <View style={AppStyles.flex6}>
                        <Text numberOfLines={1} style={[
                            styles.accountLabel,
                            hasPro && styles.accountLabelDark,
                        ]}>
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
                                // light
                                roundedMini
                                light
                                icon="IconEdit"
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
                        <Text style={[AppStyles.smalltext, AppStyles.bold, AppStyles.colorGrey, styles.subLabel]}>
                            {Localize.t('global.address')}:
                        </Text>
                        <Text style={[AppStyles.monoSubText, AppStyles.colorBlue]}>{item.address}</Text>
                        <View style={[styles.proBadge]}>
                            { fetchingPro && <LoadingIndicator /> }
                            { !fetchingPro && <ProBadge hasPro={hasPro ? 1 : 0} /> }
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { accounts, dataSource, reorderEnabled, isMigrationRequired, loadingAccountDetails } = this.state;

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
                                      Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
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
                        resizeMode="cover"
                        source={
                            StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')
                        }
                        style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.paddingBottom]}
                    >
                        <Image style={AppStyles.emptyIcon} source={StyleService.getImage('ImageFirstAccount')} />
                        <Spacer size={10} />
                        <Text style={[
                            AppStyles.emptyText,
                            AppStyles.p,
                        ]}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
                        <Button
                            label={Localize.t('home.addAccount')}
                            icon="IconPlus"
                            iconStyle={AppStyles.imgColorWhite}
                            nonBlock
                            style={[
                                AppStyles.marginBottom,
                            ]}
                            onPress={() => {
                                Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
                            }}
                        />
                    </ImageBackground>
                ) : (
                    <View style={[
                        AppStyles.flex1,
                        AppStyles.windowSize,
                    ]}>
                        {isMigrationRequired && !reorderEnabled && !loadingAccountDetails ? (
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
                                        Navigator.push<CipherMigrationViewProps>(
                                            AppScreens.Account.Migration.CipherMigration,
                                            {},
                                        );
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
                        ) : !loadingAccountDetails && (
                            <View style={styles.rowAddContainer}>
                                <Button
                                    testID="add-account-button"
                                    label={Localize.t('home.addAccount')}
                                    icon="IconPlus"
                                    roundedSmall
                                    secondary
                                    onPress={() => {
                                        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
                                    }}
                                />
                            </View>
                        )}

                        { loadingAccountDetails && (
                            <View style={AppStyles.paddingTop}>
                                <LoadingIndicator size="large" />
                            </View>
                        ) }
                        
                        { !loadingAccountDetails && (
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
                        ) }
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountListView;
