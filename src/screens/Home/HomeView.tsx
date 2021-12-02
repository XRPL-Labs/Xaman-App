/**
 * Home Screen
 */

import { find, has } from 'lodash';

import React, { Component, Fragment } from 'react';
import { View, SafeAreaView, Text, Image, ImageBackground, InteractionManager, Share, Alert } from 'react-native';

import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AccountService, SocketService, BackendService, StyleService, LedgerService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema, CoreSchema } from '@store/schemas/latest';

// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { VibrateHapticFeedback, Prompt, Toast } from '@common/helpers/interface';

import { CalculateAvailableBalance } from '@common/utils/balance';

import Localize from '@locale';

// components
import {
    TouchableDebounce,
    Button,
    RaisedButton,
    InfoMessage,
    Spacer,
    Icon,
    LoadingIndicator,
} from '@components/General';
import { TrustLineList } from '@components/Modules';

// style
import { AppStyles, AppFonts } from '@theme';
import { ChainColors } from '@theme/colors';
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
                AccountService.updateAccountsDetails([account.address]);
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
            this.setNodeChainHeader(coreSettings);
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

        const currentSettings = settings || coreSettings;

        if (currentSettings.developerMode) {
            // get chain from current default node
            const chain = CoreRepository.getChainFromNode(currentSettings.defaultNode);

            // show the header
            Navigator.mergeOptions(
                {
                    topBar: {
                        hideOnScroll: true,
                        visible: true,
                        animate: true,
                        background: {
                            color: ChainColors[chain],
                        },
                        title: {
                            text: chain.toUpperCase(),
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

    showBalanceExplain = () => {
        const { account } = this.state;

        // don't show the explain screen when account is not activated
        if (account.balance === 0) {
            return;
        }

        Navigator.showOverlay(AppScreens.Overlay.ExplainBalance, { account });
    };

    openActiveAccountDescription = () => {
        Navigator.showModal(AppScreens.Modal.Help, {
            title: Localize.t('home.howActivateMyAccount'),
            content: Localize.t('home.howActivateMyAccountDesc', {
                baseReserve: LedgerService.getNetworkReserve().BaseReserve,
            }),
        });
    };

    showCurrencyOptions = (trustLine: TrustLineSchema) => {
        const { account } = this.state;

        Navigator.showOverlay(
            AppScreens.Overlay.CurrencySettings,
            { trustLine, account },
            {
                overlay: {
                    interceptTouchOutside: false,
                },
            },
        );
    };

    showNFTDetails = (trustLine: TrustLineSchema) => {
        const { account } = this.state;

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: 'xumm.nft-info',
                account,
                params: {
                    issuer: trustLine.currency.issuer,
                    token: trustLine.currency.currency,
                },
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
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

    onShowAccountQRPress = () => {
        const { account } = this.state;

        const isSignable = AccountRepository.isSignable(account);

        if (isSignable) {
            this.showShareOverlay();
        } else {
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
        }
    };

    showShareOverlay = () => {
        const { account } = this.state;

        if (account) {
            Navigator.showOverlay(AppScreens.Overlay.ShareAccount, { account });
        }
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
                    <Image style={[styles.logo]} source={StyleService.getImage('XummLogo')} />
                </View>
                {account?.isValid() && (
                    <View style={[AppStyles.flex1]}>
                        <Button
                            onPress={() => {
                                Navigator.showOverlay(AppScreens.Overlay.SwitchAccount);
                            }}
                            light
                            roundedSmall
                            style={styles.switchAccountButton}
                            iconSize={14}
                            icon="IconSwitchAccount"
                            label={Localize.t('account.switchAccount')}
                        />
                    </View>
                )}
            </Fragment>
        );
    };

    onTrustLinePress = (line: TrustLineSchema) => {
        const { isSpendable } = this.state;

        if (!line) {
            return;
        }

        if (isSpendable) {
            this.showCurrencyOptions(line);
        } else if (line.isNFT) {
            this.showNFTDetails(line);
        }
    };

    renderAssets = () => {
        const { account, discreetMode, isSpendable } = this.state;

        // accounts is not activated
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
                                <TouchableDebounce
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
                                            <Text style={[AppStyles.pbold]}>{a.label}</Text>
                                            <Text style={[AppStyles.subtext, AppStyles.mono, AppStyles.colorBlue]}>
                                                {a.address}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableDebounce>
                            );
                        })}
                    </View>
                );
            }

            return (
                <View style={[AppStyles.flex6]} testID="not-activated-account-container">
                    <InfoMessage type="error" label={Localize.t('account.yourAccountIsNotActivated')} />
                    <TouchableDebounce
                        style={[AppStyles.row, AppStyles.centerContent, AppStyles.marginTopSml]}
                        onPress={this.openActiveAccountDescription}
                    >
                        <Icon name="IconInfo" size={20} style={[styles.trustLineInfoIcon]} />
                        <Text
                            style={[
                                AppStyles.subtext,
                                AppStyles.textCenterAligned,
                                AppStyles.link,
                                AppStyles.colorGrey,
                            ]}
                        >
                            {Localize.t('home.howActivateMyAccount')}
                        </Text>
                    </TouchableDebounce>
                </View>
            );
        }

        return (
            <TrustLineList
                testID="trustLine-list-container"
                style={[styles.trustLineListContainer]}
                account={account}
                onLinePress={this.onTrustLinePress}
                discreetMode={discreetMode}
                showAddButton={isSpendable}
            />
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
                        onPress={this.onShowAccountQRPress}
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

                <ImageBackground
                    source={StyleService.getImage('BackgroundShapes')}
                    imageStyle={AppStyles.BackgroundShapes}
                    style={[AppStyles.contentContainer, AppStyles.padding]}
                >
                    <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageFirstAccount')} />
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
            </SafeAreaView>
        );
    };

    renderBalance = () => {
        const { showRate, isLoadingRate, account, discreetMode, currencyRate } = this.state;

        if (account.balance === 0) return null;

        let balance = '0';

        if (!isLoadingRate) {
            const availableBalance = CalculateAvailableBalance(account, true);
            if (showRate) {
                balance = `${currencyRate.symbol} ${Localize.formatNumber(
                    Number(availableBalance) * Number(currencyRate.lastRate),
                )}`;
            } else {
                balance = Localize.formatNumber(availableBalance);
            }
        }

        return (
            <>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <Text numberOfLines={1} style={[AppStyles.flex1, styles.balanceLabel]}>
                        {Localize.t('home.balance')}
                    </Text>

                    <TouchableDebounce style={AppStyles.paddingRightSml} onPress={this.toggleDiscreetMode}>
                        <Text style={[styles.cardSmallLabel]}>
                            <Icon
                                style={[AppStyles.imgColorGrey]}
                                size={12}
                                name={discreetMode ? 'IconEyeOff' : 'IconEye'}
                            />
                            {'  '}
                            {discreetMode ? Localize.t('home.showBalance') : Localize.t('home.hideBalance')}
                        </Text>
                    </TouchableDebounce>

                    <TouchableDebounce onPress={this.showBalanceExplain}>
                        <Text style={[styles.cardSmallLabel]}>
                            <Icon style={[AppStyles.imgColorGrey]} size={12} name="IconInfo" />
                            {'  '}
                            {Localize.t('home.explainBalance')}
                        </Text>
                    </TouchableDebounce>
                </View>
                <TouchableDebounce activeOpacity={0.7} style={[styles.balanceContainer]} onPress={this.toggleBalance}>
                    {!discreetMode && !showRate && <Icon name="IconXrp" size={16} style={styles.xrpIcon} />}

                    {isLoadingRate ? (
                        <LoadingIndicator style={styles.rateLoader} />
                    ) : (
                        <Text
                            testID="account-balance-label"
                            style={[styles.balanceText, discreetMode && AppStyles.colorGrey]}
                        >
                            {discreetMode ? '••••••••' : balance}
                        </Text>
                    )}
                </TouchableDebounce>
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
                    <TouchableDebounce onPress={this.onShowAccountQRPress} activeOpacity={0.8}>
                        <Text
                            testID="account-address-text"
                            adjustsFontSizeToFit
                            numberOfLines={1}
                            style={[styles.cardAddressText, discreetMode && AppStyles.colorGrey]}
                        >
                            {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                        </Text>
                    </TouchableDebounce>
                </View>
                <TouchableDebounce hitSlop={{ left: 25, right: 25 }} onPress={this.onShowAccountQRPress}>
                    <Icon style={[styles.iconShare]} size={16} name="IconShare" />
                </TouchableDebounce>
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
