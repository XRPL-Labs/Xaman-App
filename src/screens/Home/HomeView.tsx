/**
 * Home Screen
 */

import { isEmpty, find, has } from 'lodash';

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

import { LedgerService, SocketService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema, CoreSchema } from '@store/schemas/latest';

import { NormalizeCurrencyCode, FormatNumber } from '@common/libs/utils';
// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { VibrateHapticFeedback } from '@common/helpers/interface';

import Localize from '@locale';

// components
import { Button, RaisedButton, InfoMessage, Spacer, Icon } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    isSpendable: boolean;
    discreetMode: boolean;
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

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            account: AccountRepository.getDefaultAccount(),
            isSpendable: false,
            discreetMode: coreSettings.discreetMode,
        };
    }

    componentDidMount() {
        // update UI on accounts update
        AccountRepository.on('accountUpdate', this.updateUI);

        // update spendable accounts on account add/remove
        AccountRepository.on('accountCreate', this.updateSpendableStatus);
        AccountRepository.on('accountRemove', this.updateSpendableStatus);

        CoreRepository.on('updateSettings', this.updateDiscreetMode);

        // listen for screen appear event
        Navigation.events().bindComponent(this);

        // update spendable status
        this.updateSpendableStatus();
    }

    componentDidAppear() {
        const { account } = this.state;

        InteractionManager.runAfterInteractions(() => {
            if (!isEmpty(account) && account.isValid() && SocketService.isConnected()) {
                // update account details
                LedgerService.updateAccountsDetails([account.address]);
            }
        });
    }

    updateDiscreetMode = (coreSettings: CoreSchema, changes: Partial<CoreSchema>) => {
        const { discreetMode } = this.state;

        if (has(changes, 'discreetMode') && discreetMode !== changes.discreetMode) {
            this.setState({
                discreetMode: coreSettings.discreetMode,
            });
        }
    };

    updateUI = (updatedAccount: AccountSchema) => {
        if (updatedAccount.isValid() && updatedAccount.default) {
            // update the UI
            this.setState(
                {
                    account: updatedAccount,
                },
                () => {
                    // when account balance changed update spendable accounts
                    this.updateSpendableStatus();
                },
            );
        }
    };

    // eslint-disable-next-line react/destructuring-assignment
    updateSpendableStatus = (account = this.state.account) => {
        if (!isEmpty(account) && account.isValid()) {
            const spendableAccounts = AccountRepository.getSpendableAccounts();

            this.setState({
                account,
                isSpendable: !!find(spendableAccounts, { address: account.address }),
            });
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

    toggleDiscreetMode = () => {
        const { discreetMode } = this.state;

        CoreRepository.saveSettings({
            discreetMode: !discreetMode,
        });
    };

    showShareOverlay = () => {
        const { account } = this.state;

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
    };

    pushSendScreen = () => {
        Navigator.push(AppScreens.Transaction.Payment);
    };

    renderHeader = () => {
        const { account } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Image style={[styles.logo]} source={Images.xummLogo} />
                </View>
                {!isEmpty(account) && account.isValid() && (
                    <View style={[AppStyles.flex1]}>
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

    renderAssets = () => {
        const { account, discreetMode, isSpendable } = this.state;

        if (account.balance === 0) {
            // check if account is a regular key to one of xumm accounts
            const isRegularKey = AccountRepository.isRegularKey(account.address);

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
                <View style={[AppStyles.flex6]} testID="not-activated-account-container">
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
            <View style={[AppStyles.flex6, styles.currencyList]} testID="activated-account-container">
                <View style={[AppStyles.row, AppStyles.centerContent, styles.trustLinesHeader]}>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Text style={[AppStyles.pbold]}>{Localize.t('home.otherAssets')}</Text>
                    </View>
                    {isSpendable && (
                        <View style={[AppStyles.flex5]}>
                            <Button
                                testID="add-asset-button"
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
                    <View testID="assets-empty-view" style={[styles.noTrustlineMessage]}>
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

                {!isEmpty(account.lines) && (
                    <ScrollView testID="assets-scroll-view" style={AppStyles.flex1}>
                        {account.lines.map((line: TrustLineSchema, index: number) => {
                            return (
                                <TouchableOpacity
                                    testID={`line-${line.currency.issuer}`}
                                    onPress={() => {
                                        if (isSpendable) {
                                            this.showCurrencyOptions(line);
                                        }
                                    }}
                                    activeOpacity={isSpendable ? 0.5 : 1}
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
                                                {line.currency.issuer === account.address
                                                    ? Localize.t('home.selfIssued')
                                                    : `${line.counterParty.name} ${
                                                          // eslint-disable-next-line max-len
                                                          line.currency.name
                                                              ? NormalizeCurrencyCode(line.currency.currency)
                                                              : ''
                                                      }`}
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
                                                style={[styles.currencyAvatar, discreetMode && AppStyles.imgColorGrey]}
                                                source={{ uri: line.currency.avatar }}
                                            />
                                        )}
                                        <Text
                                            style={[
                                                AppStyles.pbold,
                                                AppStyles.monoBold,
                                                discreetMode && AppStyles.colorGreyDark,
                                            ]}
                                        >
                                            {discreetMode ? '••••••••' : FormatNumber(line.balance)}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        );
    };

    renderButtons = () => {
        const { isSpendable } = this.state;

        if (!isSpendable) {
            return null;
        }

        return (
            <View style={[styles.buttonRow]}>
                <RaisedButton
                    testID="send-button"
                    style={[styles.sendButton]}
                    icon="IconCornerLeftUp"
                    iconSize={25}
                    iconStyle={[styles.sendButtonIcon]}
                    label={Localize.t('global.send')}
                    textStyle={[styles.sendButtonText]}
                    onPress={this.pushSendScreen}
                    activeOpacity={0}
                />
                <RaisedButton
                    testID="request-button"
                    style={[styles.requestButton]}
                    icon="IconCornerRightDown"
                    iconSize={25}
                    iconStyle={[styles.requestButtonIcon]}
                    iconPosition="right"
                    label={Localize.t('global.request')}
                    textStyle={[styles.requestButtonText]}
                    onPress={this.showShareOverlay}
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
                        <Text style={[AppStyles.emptyText]}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
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
        const { account, discreetMode } = this.state;

        if (isEmpty(account) || !account.isValid()) {
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
                            <TouchableOpacity onPress={this.toggleDiscreetMode}>
                                <Icon
                                    style={[styles.iconEye]}
                                    size={20}
                                    name={discreetMode ? 'IconEyeOff' : 'IconEye'}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                VibrateHapticFeedback('impactMedium');

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
                                testID="account-address-text"
                                adjustsFontSizeToFit
                                numberOfLines={1}
                                selectable={!discreetMode}
                                style={[
                                    AppStyles.flex1,
                                    styles.cardAddressText,
                                    discreetMode && AppStyles.colorGreyDark,
                                ]}
                            >
                                {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                            </Text>
                            <View style={[styles.shareIconContainer, AppStyles.rightSelf]}>
                                <Icon name="IconShare" size={18} style={[styles.shareIcon]} />
                            </View>
                        </TouchableOpacity>

                        {account.balance !== 0 && (
                            <>
                                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                    <Text style={[AppStyles.flex1, styles.cardLabel]}>
                                        {Localize.t('global.balance')}:
                                    </Text>

                                    <TouchableOpacity onPress={this.showBalanceExplain}>
                                        <Text style={[styles.cardSmallLabel]}>
                                            {Localize.t('home.explainMyBalance')}{' '}
                                            <Icon style={[AppStyles.imgColorGreyDark]} size={11} name="IconInfo" />
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={[styles.currencyItemCard]}>
                                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                        <View style={[styles.xrpAvatarContainer]}>
                                            <Icon name="IconXrp" size={20} style={[styles.xrpAvatar]} />
                                        </View>
                                        <Text style={[styles.currencyItemLabel]}>XRP</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            AppStyles.flex4,
                                            AppStyles.row,
                                            AppStyles.centerAligned,
                                            AppStyles.flexEnd,
                                        ]}
                                        onPress={this.showBalanceExplain}
                                    >
                                        <Text
                                            testID="account-balance-label"
                                            style={[
                                                AppStyles.h5,
                                                AppStyles.monoBold,
                                                discreetMode && AppStyles.colorGreyDark,
                                            ]}
                                        >
                                            {discreetMode ? '••••••••' : FormatNumber(account.availableBalance)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {this.renderButtons()}
                    </View>
                    {this.renderAssets()}
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeView;
