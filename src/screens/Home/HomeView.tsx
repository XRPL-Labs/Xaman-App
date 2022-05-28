/**
 * Home Screen
 */

import { find, has } from 'lodash';

import React, { Component, Fragment } from 'react';
import { View, Text, Image, ImageBackground, InteractionManager, Share, Alert } from 'react-native';

import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AccountService, SocketService, StyleService, LedgerService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema, CoreSchema } from '@store/schemas/latest';

// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { VibrateHapticFeedback, Prompt } from '@common/helpers/interface';

import Localize from '@locale';

// components
import { TouchableDebounce, Button, RaisedButton, InfoMessage, Spacer, Icon, Badge } from '@components/General';
import { ProBadge, TokenList } from '@components/Modules';

// style
import { AppStyles, AppFonts } from '@theme';
import { ChainColors } from '@theme/colors';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    timestamp: number;
}

export interface State {
    accountsCount: number;
    account: AccountSchema;
    coreSettings: CoreSchema;
    isSpendable: boolean;
    discreetMode: boolean;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;

    private navigationListener: any;

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            accountsCount: undefined,
            account: undefined,
            isSpendable: false,
            coreSettings,
            discreetMode: coreSettings.discreetMode,
        };
    }

    componentDidMount() {
        // update UI on accounts update
        AccountRepository.on('accountUpdate', this.updateDefaultAccount);
        // update spendable accounts on account add/remove
        AccountRepository.on('accountCreate', this.getDefaultAccount);
        AccountRepository.on('accountRemove', this.getDefaultAccount);
        // update discreetMode and developerMode on change
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
            // Update account details when component didAppear and Socket is connected
            if (account?.isValid() && SocketService.isConnected()) {
                // only update current account details
                AccountService.updateAccountsDetails([account.address]);
            }
        });
    }

    /*
        Handle events when something in CoreSettings has been changed
        Monitoring `discreetMode`, `developerMode`, `defaultNode` changes
     */
    onCoreSettingsUpdate = (coreSettings: CoreSchema, changes: Partial<CoreSchema>) => {
        const { discreetMode } = this.state;

        // default discreetMode has changed
        if (has(changes, 'discreetMode') && discreetMode !== changes.discreetMode) {
            this.setState({
                discreetMode: coreSettings.discreetMode,
            });
        }

        // developer mode or default node has been changed
        if (has(changes, 'developerMode') || has(changes, 'defaultNode')) {
            this.setNodeChainHeader(coreSettings);
        }
    };

    updateDefaultAccount = (updatedAccount: AccountSchema, changes: Partial<AccountSchema>) => {
        // update account visible count
        if (updatedAccount?.isValid() && changes?.hidden) {
            this.setState({
                accountsCount: AccountRepository.getVisibleAccountCount(),
            });
        }

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
                accountsCount: AccountRepository.getVisibleAccountCount(),
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
            Navigator.mergeOptions(componentId, {
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
            });
        } else {
            Navigator.mergeOptions(componentId, {
                topBar: {
                    visible: false,
                },
            });
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

    onTokenPress = (line: TrustLineSchema) => {
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

    onSwitchButtonPress = () => {
        const { accountsCount } = this.state;

        // if account count is zero or 1 then show add account
        if (accountsCount === 1) {
            Navigator.push(AppScreens.Account.Add);
            return;
        }

        Navigator.showOverlay(AppScreens.Overlay.SwitchAccount);
    };

    renderHeader = () => {
        const { account, accountsCount } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.flexStart]}>
                    <Image style={[styles.logo]} source={StyleService.getImage('XummLogo')} />
                    <ProBadge />
                </View>
                {account?.isValid() && (
                    <View style={[AppStyles.flex1, AppStyles.centerAligned]}>
                        <Button
                            light
                            roundedMini
                            onPress={this.onSwitchButtonPress}
                            style={styles.switchAccountButton}
                            iconSize={12}
                            icon={accountsCount > 1 ? 'IconSwitchAccount' : 'IconPlus'}
                            label={accountsCount > 1 ? Localize.t('global.accounts') : Localize.t('home.addAccount')}
                            extraComponent={
                                accountsCount > 1 && (
                                    <Badge
                                        containerStyle={styles.accountCountBadgeContainer}
                                        labelStyle={styles.accountCountBadgeLabel}
                                        label={`${accountsCount > 9 ? '9+' : accountsCount}`}
                                        type="count"
                                    />
                                )
                            }
                        />
                    </View>
                )}
            </Fragment>
        );
    };

    renderAssets = () => {
        const { timestamp } = this.props;
        const { account, discreetMode, isSpendable } = this.state;

        // accounts is not activated
        if (account.balance === 0) {
            // check if account is a regular key to one of xumm accounts
            const isRegularKey = AccountRepository.isRegularKey(account.address);

            if (isRegularKey) {
                const keysForAccounts = AccountRepository.findBy('regularKey', account.address);

                return (
                    <View style={[AppStyles.flex6, AppStyles.paddingHorizontalSml]}>
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
                <View
                    style={[AppStyles.flex6, AppStyles.paddingHorizontalSml]}
                    testID="not-activated-account-container"
                >
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
            <TokenList
                timestamp={timestamp}
                testID="token-list-container"
                style={styles.tokenListContainer}
                account={account}
                onTokenPress={this.onTokenPress}
                discreetMode={discreetMode}
                readonly={!isSpendable}
            />
        );
    };

    renderButtons = () => {
        const { isSpendable } = this.state;

        if (isSpendable) {
            return (
                <View style={[styles.buttonRow]}>
                    <RaisedButton
                        small
                        testID="send-button"
                        containerStyle={styles.sendButtonContainer}
                        icon="IconCornerLeftUp"
                        iconSize={18}
                        iconStyle={[styles.sendButtonIcon]}
                        label={Localize.t('global.send')}
                        textStyle={styles.sendButtonText}
                        onPress={this.pushSendScreen}
                    />
                    <RaisedButton
                        small
                        testID="request-button"
                        containerStyle={styles.requestButtonContainer}
                        icon="IconCornerRightDown"
                        iconSize={18}
                        iconStyle={styles.requestButtonIcon}
                        label={Localize.t('global.request')}
                        textStyle={styles.requestButtonText}
                        onPress={this.onShowAccountQRPress}
                    />
                </View>
            );
        }

        return (
            <View style={[styles.buttonRow]}>
                <RaisedButton
                    small
                    testID="show-account-qr-button"
                    icon="IconQR"
                    iconSize={20}
                    label={Localize.t('account.showAccountQR')}
                    textStyle={[styles.QRButtonText]}
                    onPress={this.onShowAccountQRPress}
                />
            </View>
        );
    };

    renderEmpty = () => {
        return (
            <View testID="home-tab-empty-view" style={AppStyles.tabContainer}>
                <View style={[styles.headerContainer]}>{this.renderHeader()}</View>

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
            </View>
        );
    };

    renderAccountDetails = () => {
        const { account, discreetMode } = this.state;

        return (
            <View style={[AppStyles.row, AppStyles.paddingHorizontalSml]}>
                <View style={[AppStyles.flex1]}>
                    <Text style={[styles.accountLabelText]} numberOfLines={1}>
                        {account.label}
                    </Text>
                    <TouchableDebounce onPress={this.onShowAccountQRPress} activeOpacity={0.8}>
                        <Text
                            testID="account-address-text"
                            adjustsFontSizeToFit
                            numberOfLines={1}
                            style={[styles.accountAddressText, discreetMode && AppStyles.colorGrey]}
                        >
                            {discreetMode ? '••••••••••••••••••••••••••••••••' : account.address}
                        </Text>
                    </TouchableDebounce>
                </View>
                <TouchableDebounce hitSlop={{ left: 25, right: 25 }} onPress={this.toggleDiscreetMode}>
                    <Icon style={[styles.iconEye]} size={18} name={discreetMode ? 'IconEyeOff' : 'IconEye'} />
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
            <View testID="home-tab-view" style={AppStyles.tabContainer}>
                {/* Header */}
                <View style={styles.headerContainer}>{this.renderHeader()}</View>

                {/* Content */}
                <View style={AppStyles.contentContainer}>
                    {this.renderAccountDetails()}
                    {this.renderButtons()}
                    {this.renderAssets()}
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeView;
