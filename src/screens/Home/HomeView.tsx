/**
 * Home Screen
 */

import { find, has } from 'lodash';

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
    Alert,
    ActivityIndicator,
} from 'react-native';

import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { LedgerService, SocketService, BackendService } from '@services';

import { AccessLevels, NodeChain } from '@store/types';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema, CoreSchema } from '@store/schemas/latest';

import { NormalizeCurrencyCode } from '@common/libs/utils';
// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { VibrateHapticFeedback, Prompt, Toast } from '@common/helpers/interface';

import Localize from '@locale';

// components
import { Button, RaisedButton, InfoMessage, Spacer, Icon, AmountText } from '@components/General';

// style
import { AppStyles, AppColors, AppFonts } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    account: AccountSchema;
    coreSettings: CoreSchema;
    isSpendable: boolean;
    discreetMode: boolean;
    isLoadingRate: boolean;
    showRate: boolean;
    currency: string;
    currencyRate: any;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;

    private navigationListener: any;

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            account: undefined,
            isSpendable: false,
            coreSettings,
            currency: coreSettings.currency,
            discreetMode: coreSettings.discreetMode,
            isLoadingRate: false,
            showRate: false,
            currencyRate: undefined,
        };
    }

    componentDidMount() {
        // update UI on accounts update
        AccountRepository.on('accountUpdate', this.updateDefaultAccount);

        // update spendable accounts on account add/remove
        AccountRepository.on('accountCreate', this.getDefaultAccount);
        AccountRepository.on('accountRemove', this.getDefaultAccount);

        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);

        // listen for screen appear event
        this.navigationListener = Navigation.events().bindComponent(this);

        InteractionManager.runAfterInteractions(() => {
            // set default account
            this.getDefaultAccount();

            // set dev mode header
            this.setNodeChainHeader();
        });
    }

    componentWillUnmount() {
        // remove listeners

        if (this.navigationListener) {
            this.navigationListener.remove();
        }

        AccountRepository.off('accountUpdate', this.updateDefaultAccount);
        AccountRepository.off('accountCreate', this.getDefaultAccount);
        AccountRepository.off('accountRemove', this.getDefaultAccount);
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    componentDidAppear() {
        const { account } = this.state;

        InteractionManager.runAfterInteractions(() => {
            if (account?.isValid() && SocketService.isConnected()) {
                // update account details
                LedgerService.updateAccountsDetails([account.address]);
            }
        });
    }

    onCoreSettingsUpdate = (coreSettings: CoreSchema, changes: Partial<CoreSchema>) => {
        const { discreetMode, currency, showRate } = this.state;

        // discreetMode changed
        if (has(changes, 'discreetMode') && discreetMode !== changes.discreetMode) {
            this.setState({
                discreetMode: coreSettings.discreetMode,
            });
        }

        // currency changed
        if (has(changes, 'currency') && currency !== changes.currency) {
            this.setState(
                {
                    currency: coreSettings.currency,
                },
                () => {
                    // turn to XRP
                    if (showRate) {
                        this.toggleBalance();
                    }
                },
            );
        }

        if (has(changes, 'developerMode') || has(changes, 'defaultNode')) {
            setTimeout(() => {
                this.setNodeChainHeader(coreSettings);
            }, 500);
        }
    };

    updateDefaultAccount = (updatedAccount: AccountSchema) => {
        if (updatedAccount?.isValid() && updatedAccount.default) {
            // update the UI
            this.setState(
                {
                    account: updatedAccount,
                },
                // when account balance changed update spendable accounts
                this.updateSpendableStatus,
            );
        }
    };

    getDefaultAccount = () => {
        this.setState(
            {
                account: AccountRepository.getDefaultAccount(),
            },
            // when account balance changed update spendable accounts
            this.updateSpendableStatus,
        );
    };

    setNodeChainHeader = (settings?: CoreSchema) => {
        // @ts-ignore
        const { componentId } = this.props;
        const { coreSettings } = this.state;

        if (settings ? settings.developerMode : coreSettings.developerMode) {
            Navigator.mergeOptions(
                {
                    topBar: {
                        hideOnScroll: true,
                        visible: true,
                        animate: true,
                        background: {
                            color: SocketService.chain === NodeChain.Main ? AppColors.blue : AppColors.green,
                        },
                        title: {
                            text: SocketService.chain === NodeChain.Main ? 'MAINNET' : 'TESTNET',
                            color: 'white',
                            fontFamily: AppFonts.base.familyExtraBold,
                            fontSize: AppFonts.h5.size,
                        },
                    },
                },
                componentId,
            );
        } else {
            Navigator.mergeOptions(
                {
                    topBar: {
                        visible: false,
                    },
                },
                componentId,
            );
        }
    };

    // eslint-disable-next-line react/destructuring-assignment
    updateSpendableStatus = (account = this.state.account) => {
        if (account?.isValid()) {
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

    showNFTDetails = (trustLine: TrustLineSchema) => {
        const { account } = this.state;

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
            {
                identifier: 'xumm.nft-info',
                account,
                params: {
                    issuer: trustLine.currency.issuer,
                    token: trustLine.currency.currency,
                },
            },
        );
    };

    toggleDiscreetMode = () => {
        const { discreetMode } = this.state;

        this.setState({
            discreetMode: !discreetMode,
        });
    };

    showExchangeAccountAlert = () => {
        Alert.alert(Localize.t('global.warning'), Localize.t('home.exchangeAccountReadonlyExplain'));
    };

    onRequestPress = () => {
        Navigator.push(AppScreens.Transaction.Request);
    };

    onShowAccountQRPress = () => {
        const { account } = this.state;

        if (account.accessLevel === AccessLevels.Readonly) {
            Prompt(
                Localize.t('global.warning'),
                Localize.t('home.shareReadonlyAccountWarning'),
                [
                    {
                        text: Localize.t('home.exchangeAccount'),
                        style: 'destructive',
                        onPress: this.showExchangeAccountAlert,
                    },
                    {
                        text: Localize.t('home.iOwnTheKeys'),
                        onPress: this.showShareOverlay,
                    },
                ],
                { type: 'default' },
            );
        } else {
            this.showShareOverlay();
        }
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

    shareAddress = () => {
        const { account } = this.state;

        VibrateHapticFeedback('impactMedium');

        Share.share({
            title: Localize.t('home.shareAccount'),
            message: account.address,
            url: undefined,
        }).catch(() => {});
    };

    toggleBalance = () => {
        const { showRate, currency } = this.state;

        if (!showRate) {
            this.setState({
                isLoadingRate: true,
                showRate: true,
            });

            BackendService.getCurrencyRate(currency)
                .then((r) => {
                    this.setState({
                        currencyRate: r,
                        isLoadingRate: false,
                    });
                })
                .catch(() => {
                    Toast(Localize.t('global.unableToFetchCurrencyRate'));

                    this.setState({
                        isLoadingRate: false,
                        showRate: false,
                    });
                });
        } else {
            this.setState({
                showRate: false,
            });
        }
    };

    renderHeader = () => {
        const { account } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Image style={[styles.logo]} source={Images.xummLogo} />
                </View>
                {account?.isValid() && (
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
                        <Text numberOfLines={1} style={[AppStyles.pbold]}>
                            {Localize.t('home.otherAssets')}
                        </Text>
                    </View>
                    {isSpendable && (
                        <View style={[AppStyles.flex5]}>
                            <Button
                                numberOfLines={1}
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

                {account.lines.length === 0 && (
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

                {account.lines.length > 0 && (
                    <ScrollView testID="assets-scroll-view" style={AppStyles.flex1}>
                        {account.lines.map((line: TrustLineSchema, index: number) => {
                            return (
                                <TouchableOpacity
                                    testID={`line-${line.currency.issuer}`}
                                    onPress={() => {
                                        if (isSpendable) {
                                            this.showCurrencyOptions(line);
                                        } else if (line.isNFT) {
                                            this.showNFTDetails(line);
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

                                        {discreetMode ? (
                                            <Text
                                                style={[AppStyles.pbold, AppStyles.monoBold, AppStyles.colorGreyDark]}
                                            >
                                                ••••••••
                                            </Text>
                                        ) : (
                                            <AmountText
                                                value={line.balance}
                                                style={[AppStyles.pbold, AppStyles.monoBold]}
                                            />
                                        )}
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

        if (isSpendable) {
            return (
                <View style={[styles.buttonRow, styles.buttonRowHalf]}>
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
                        onPress={this.onRequestPress}
                        activeOpacity={0}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.buttonRow]}>
                <RaisedButton
                    testID="qr-button"
                    icon="IconQR"
                    iconSize={20}
                    label={Localize.t('account.showAccountQR')}
                    textStyle={[styles.QRButtonText]}
                    onPress={this.onShowAccountQRPress}
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

    renderBalance = () => {
        const { showRate, isLoadingRate, account, discreetMode, currencyRate } = this.state;

        if (account.balance === 0) return null;

        let balance = '0';

        if (!isLoadingRate) {
            if (showRate) {
                balance = `${currencyRate.symbol} ${Localize.formatNumber(
                    Number(account.availableBalance) * Number(currencyRate.lastRate),
                )}`;
            } else {
                balance = Localize.formatNumber(account.availableBalance);
            }
        }

        return (
            <>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <Text numberOfLines={1} style={[AppStyles.flex1, styles.balanceLabel]}>
                        {Localize.t('global.balance')}
                    </Text>

                    <TouchableOpacity style={AppStyles.paddingRightSml} onPress={this.toggleDiscreetMode}>
                        <Text style={[styles.cardSmallLabel]}>
                            <Icon
                                style={[AppStyles.imgColorGreyDark]}
                                size={12}
                                name={discreetMode ? 'IconEyeOff' : 'IconEye'}
                            />
                            {'  '}
                            {discreetMode ? 'Show' : 'Hide'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={this.showBalanceExplain}>
                        <Text style={[styles.cardSmallLabel]}>
                            <Icon style={[AppStyles.imgColorGreyDark]} size={12} name="IconInfo" />
                            {'  '}Explain
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity activeOpacity={0.7} style={[styles.balanceContainer]} onPress={this.toggleBalance}>
                    {!discreetMode && !showRate && <Icon name="IconXrp" size={16} style={styles.xrpIcon} />}

                    {isLoadingRate ? (
                        <ActivityIndicator color={AppColors.greyBlack} style={styles.rateLoader} />
                    ) : (
                        <Text
                            testID="account-balance-label"
                            style={[styles.balanceText, discreetMode && AppStyles.colorGreyDark]}
                        >
                            {discreetMode ? '••••••••' : balance}
                        </Text>
                    )}
                </TouchableOpacity>
            </>
        );
    };

    renderAccountDetails = () => {
        const { account, discreetMode } = this.state;

        return (
            <View style={[AppStyles.row, AppStyles.paddingBottomSml]}>
                <View style={[AppStyles.flex1]}>
                    <Text style={[AppStyles.h5]} numberOfLines={1}>
                        {account.label}
                    </Text>
                    <Text
                        testID="account-address-text"
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        selectable={!discreetMode}
                        style={[styles.cardAddressText, discreetMode && AppStyles.colorGreyDark]}
                    >
                        {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                    </Text>
                </View>
                <TouchableOpacity hitSlop={{ left: 25, right: 25 }} onPress={this.onShowAccountQRPress}>
                    <Icon style={[styles.iconShare]} size={16} name="IconShare" />
                </TouchableOpacity>
            </View>
        );
    };

    render() {
        const { account } = this.state;

        if (!account?.isValid()) {
            return this.renderEmpty();
        }

        return (
            <SafeAreaView testID="home-tab-view" style={[AppStyles.tabContainer, AppStyles.centerAligned]}>
                {/* Header */}
                <View style={[AppStyles.headerContainer]}>{this.renderHeader()}</View>

                {/* Content */}
                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontalSml]}>
                    <View style={[styles.accountCard]}>
                        {this.renderAccountDetails()}
                        {this.renderBalance()}
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
