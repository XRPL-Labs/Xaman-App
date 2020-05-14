/**
 * Home Screen
 */

import { isEmpty, find } from 'lodash';
import React, { Component, Fragment } from 'react';
import {
    View,
    SafeAreaView,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    InteractionManager,
    Share,
} from 'react-native';

import { Navigation } from 'react-native-navigation';

import { LedgerService } from '@services';

import { AccountRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { NormalizeCurrencyCode } from '@common/libs/utils';
// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

// components
import { Button, CustomButton, InfoMessage, Spacer, Icon } from '@components';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    spendableAccounts: Array<AccountSchema>;
    privacy: boolean;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);
        this.state = {
            account: AccountRepository.getDefaultAccount(),
            spendableAccounts: AccountRepository.getSpendableAccounts(),
            privacy: false,
        };
    }

    componentDidMount() {
        // update UI on accounts update
        AccountRepository.on('accountUpdate', this.updateUI);
        AccountRepository.on('changeDefaultAccount', this.onDefaultAccountChange);

        AccountRepository.on('accountCreate', this.updateSpendableAccounts);
        AccountRepository.on('accountRemove', this.updateSpendableAccounts);
        // listen for screen appear event
        Navigation.events().bindComponent(this);
    }

    componentDidAppear() {
        const { account } = this.state;
        // update account details
        InteractionManager.runAfterInteractions(() => {
            if (account.isValid()) {
                LedgerService.updateAccountsDetails([account.address]);
            } else {
                this.setState({
                    account: AccountRepository.getDefaultAccount(),
                });
            }
        });
    }

    onDefaultAccountChange = (defaultAccount: AccountSchema) => {
        // update the default account
        LedgerService.updateAccountsDetails([defaultAccount.address]);

        this.setState({
            account: defaultAccount,
        });
    };

    updateUI = (updatedAccount: AccountSchema) => {
        const { account } = this.state;

        if (updatedAccount.isValid()) {
            if (updatedAccount.default) {
                this.setState({
                    account: updatedAccount,
                });

                if (account.isValid() && account.balance !== updatedAccount.balance) {
                    this.updateSpendableAccounts();
                }
            }
        }
        if (updatedAccount.default) {
            this.setState({
                account: updatedAccount,
                spendableAccounts: AccountRepository.getSpendableAccounts(),
            });
        }
    };

    updateSpendableAccounts = () => {
        const { account } = this.state;

        if (account.isValid()) {
            setTimeout(() => {
                this.setState({
                    spendableAccounts: AccountRepository.getSpendableAccounts(),
                });
            }, 200);
        }
    };

    addCurrency = () => {
        const { account } = this.state;

        Navigator.showOverlay(
            AppScreens.Overlay.AddCurrency,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { account },
        );
    };

    showBalanceExplain = () => {
        const { account } = this.state;

        // don't show the explain screen when account is not activated
        if (account.balance === 0) {
            return;
        }

        Navigator.showOverlay(
            AppScreens.Overlay.ExplainBalance,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { account },
        );
    };

    openTrustLineDescription = () => {
        Navigator.showModal(
            AppScreens.Modal.Help,
            {},
            {
                title: Localize.t('home.whatAreOtherAssets'),
                content: Localize.t('home.otherAssetsDesc'),
            },
        );
    };

    openActiveAccountDescription = () => {
        Navigator.showModal(
            AppScreens.Modal.Help,
            {},
            {
                title: Localize.t('home.howActivateMyAccount'),
                content: Localize.t('home.howActivateMyAccountDesc'),
            },
        );
    };

    showCurrencyOptions = (trustLine: TrustLineSchema) => {
        const { account } = this.state;

        Navigator.showOverlay(
            AppScreens.Overlay.CurrencySettings,
            {
                overlay: {
                    handleKeyboardEvents: true,
                },
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { trustLine, account },
        );
    };

    togglePrivacyMode = () => {
        const { privacy } = this.state;

        this.setState({
            privacy: !privacy,
        });
    };

    renderHeader = () => {
        const { account } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                    <Image style={[styles.logo]} source={Images.xummLogo} />
                </View>
                {!isEmpty(account) && (
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            onPress={() => {
                                Navigator.showOverlay(AppScreens.Overlay.SwitchAccount, {
                                    layout: {
                                        backgroundColor: 'transparent',
                                        componentBackgroundColor: 'transparent',
                                    },
                                });
                            }}
                            style={styles.switchAccountButton}
                            textStyle={styles.switchAccountButtonText}
                            light
                            roundedSmall
                            iconSize={14}
                            iconStyle={AppStyles.imgColorBlue}
                            icon="IconSwitchAccount"
                            label={Localize.t('account.switchAccount')}
                        />
                    </View>
                )}
            </Fragment>
        );
    };

    renderContent = () => {
        const { account, privacy, spendableAccounts } = this.state;

        const spendable = !!find(spendableAccounts, { address: account.address });

        if (account.balance === 0) {
            // check if account is a regular key to one of xumm accounts
            const isRegularKey = AccountRepository.isRegularKey(account);

            if (isRegularKey) {
                const keysForAccounts = AccountRepository.findBy('regularKey', account.address);

                return (
                    <View style={[AppStyles.flex6]}>
                        <InfoMessage icon="IconKey" type="info" label={Localize.t('account.regularKeyFor')} />
                        <Spacer />
                        {keysForAccounts.map((a, index) => {
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}
                                    onPress={() => {
                                        AccountRepository.setDefaultAccount(a.address);
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                                        <Icon size={25} style={[styles.iconAccount]} name="IconAccount" />
                                        <View>
                                            <Text style={[AppStyles.p]}>{a.label}</Text>
                                            <Text style={[AppStyles.subtext, AppStyles.mono, AppStyles.colorBlue]}>
                                                {a.address}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );
            }

            return (
                <View style={[AppStyles.flex6]}>
                    <InfoMessage type="error" label={Localize.t('account.yourAccountIsNotActivated')} />
                    <TouchableOpacity
                        style={[AppStyles.row, AppStyles.centerContent, AppStyles.marginTopSml]}
                        onPress={this.openActiveAccountDescription}
                    >
                        <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                        <Text
                            style={[
                                AppStyles.subtext,
                                AppStyles.textCenterAligned,
                                AppStyles.link,
                                AppStyles.colorGreyDark,
                            ]}
                        >
                            {Localize.t('home.howActivateMyAccount')}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={[AppStyles.flex6, styles.currencyList]}>
                <View style={[AppStyles.row, AppStyles.centerContent, styles.trustLinesHeader]}>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Text style={[AppStyles.pbold]}>{Localize.t('home.otherAssets')}</Text>
                    </View>
                    {spendable && (
                        <View style={[AppStyles.flex5]}>
                            <Button
                                label={Localize.t('home.addAsset')}
                                onPress={this.addCurrency}
                                roundedSmall
                                icon="IconPlus"
                                iconStyle={[AppStyles.imgColorBlue]}
                                iconSize={20}
                                style={[AppStyles.rightSelf]}
                                light
                            />
                        </View>
                    )}
                </View>

                {isEmpty(account.lines) && (
                    <View style={[styles.noTrustlineMessage]}>
                        <InfoMessage type="warning" label={Localize.t('home.youDonNotHaveOtherAssets')} />
                        <TouchableOpacity
                            style={[AppStyles.row, AppStyles.centerContent, AppStyles.paddingSml]}
                            onPress={this.openTrustLineDescription}
                        >
                            <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                            <Text
                                style={[
                                    AppStyles.subtext,
                                    AppStyles.textCenterAligned,
                                    AppStyles.link,
                                    AppStyles.colorGreyDark,
                                ]}
                            >
                                {Localize.t('home.whatAreOtherAssets')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ScrollView style={AppStyles.flex1}>
                    {account.lines &&
                        account.lines.map((line: TrustLineSchema, index: number) => {
                            return (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (spendable) {
                                            this.showCurrencyOptions(line);
                                        }
                                    }}
                                    activeOpacity={spendable ? 0.5 : 1}
                                    style={[styles.currencyItem]}
                                    key={index}
                                >
                                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                        <View style={[styles.brandAvatarContainer]}>
                                            <Image
                                                style={[styles.brandAvatar]}
                                                source={{ uri: line.counterParty.avatar }}
                                            />
                                        </View>
                                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                                            <Text style={[styles.currencyItemLabelSmall]}>
                                                {line.currency.name
                                                    ? line.currency.name
                                                    : NormalizeCurrencyCode(line.currency.currency)}
                                            </Text>
                                            <Text style={[styles.issuerLabel]}>
                                                {line.counterParty.name}{' '}
                                                {line.currency.name
                                                    ? NormalizeCurrencyCode(line.currency.currency)
                                                    : ''}
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            AppStyles.flex4,
                                            AppStyles.row,
                                            AppStyles.centerContent,
                                            AppStyles.centerAligned,
                                            AppStyles.flexEnd,
                                        ]}
                                    >
                                        {line.currency.avatar && (
                                            <Image
                                                style={[styles.currencyAvatar, privacy && AppStyles.imgColorGrey]}
                                                source={{ uri: line.currency.avatar }}
                                            />
                                        )}
                                        <Text
                                            style={[
                                                AppStyles.pbold,
                                                AppStyles.monoBold,
                                                privacy && AppStyles.colorGreyDark,
                                            ]}
                                        >
                                            {privacy ? '••••••••' : line.balance}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                </ScrollView>
            </View>
        );
    };

    renderButtons = () => {
        const { account, spendableAccounts } = this.state;

        return (
            <View style={[styles.buttonRow]}>
                <CustomButton
                    style={[styles.sendButton]}
                    icon="IconCornerLeftUp"
                    iconSize={25}
                    iconStyle={[styles.sendButtonIcon]}
                    label={Localize.t('global.send')}
                    textStyle={[styles.sendButtonText]}
                    onPress={() => {
                        Navigator.push(AppScreens.Transaction.Payment);
                    }}
                    activeOpacity={0}
                    isDisabled={!find(spendableAccounts, { address: account.address })}
                />
                <CustomButton
                    style={[styles.requestButton]}
                    icon="IconCornerRightDown"
                    iconSize={25}
                    iconStyle={[styles.requestButtonIcon]}
                    iconPosition="right"
                    label={Localize.t('global.request')}
                    textStyle={[styles.requestButtonText]}
                    onPress={() => {
                        Navigator.showOverlay(
                            AppScreens.Overlay.ShareAccount,
                            {
                                layout: {
                                    backgroundColor: 'transparent',
                                    componentBackgroundColor: 'transparent',
                                },
                            },
                            { account },
                        );
                    }}
                    activeOpacity={0}
                />
            </View>
        );
    };

    renderEmpty = () => {
        return (
            <SafeAreaView testID="home-tab-empty-view" style={[AppStyles.tabContainer]}>
                <View style={[AppStyles.headerContainer]}>{this.renderHeader()}</View>

                <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                    <ImageBackground
                        source={Images.BackgroundShapes}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                    >
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageFirstAccount} />
                        <Text style={[AppStyles.emptyText]}>It’s a little bit empty here add your first account.</Text>
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
            </SafeAreaView>
        );
    };

    render() {
        const { account, privacy } = this.state;

        if (isEmpty(account)) {
            return this.renderEmpty();
        }

        return (
            <SafeAreaView testID="home-tab-view" style={[AppStyles.tabContainer, AppStyles.centerAligned]}>
                {/* Header */}
                <View style={[AppStyles.headerContainer]}>{this.renderHeader()}</View>

                {/* Content */}
                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontalSml]}>
                    <View style={[styles.accountCard]}>
                        <View style={[AppStyles.row]}>
                            <Text style={[AppStyles.flex1, AppStyles.h5]} numberOfLines={1}>
                                {account.label}
                            </Text>
                            <TouchableOpacity onPress={this.togglePrivacyMode}>
                                <Icon style={[styles.iconEye]} size={20} name={privacy ? 'IconEyeOff' : 'IconEye'} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                Share.share({
                                    title: Localize.t('home.shareAccount'),
                                    message: account.address,
                                    url: undefined,
                                }).catch(() => {});
                            }}
                            activeOpacity={0.9}
                            style={[AppStyles.row, styles.cardAddress]}
                        >
                            <Text
                                adjustsFontSizeToFit
                                numberOfLines={1}
                                selectable
                                style={[AppStyles.flex1, styles.cardAddressText, privacy && AppStyles.colorGreyDark]}
                            >
                                {privacy ? '••••••••••••••••••••••••••••••••' : account.address}
                            </Text>
                            <View style={[styles.shareIconContainer, AppStyles.rightSelf]}>
                                <Icon name="IconShare" size={18} style={[styles.shareIcon]} />
                            </View>
                        </TouchableOpacity>

                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            <Text style={[AppStyles.flex1, styles.cardLabel]}>{Localize.t('global.balance')}:</Text>

                            {account.balance !== 0 && (
                                <TouchableOpacity onPress={this.showBalanceExplain}>
                                    <Text style={[styles.cardSmallLabel]}>
                                        {Localize.t('home.explainMyBalance')}{' '}
                                        <Icon style={[AppStyles.imgColorGreyDark]} size={11} name="IconInfo" />
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={[styles.currencyItemCard]}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.xrpAvatarContainer]}>
                                    <Icon name="IconXrp" size={20} style={[styles.xrpAvatar]} />
                                </View>
                                <Text style={[styles.currencyItemLabel]}>XRP</Text>
                            </View>

                            <TouchableOpacity
                                style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}
                                onPress={this.showBalanceExplain}
                            >
                                <Text style={[AppStyles.h5, AppStyles.monoBold, privacy && AppStyles.colorGreyDark]}>
                                    {privacy ? '••••••••' : account.availableBalance}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {this.renderButtons()}
                    </View>
                    {this.renderContent()}
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeView;
