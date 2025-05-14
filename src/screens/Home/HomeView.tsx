/**
 * Home Screen
 */

import { find, has } from 'lodash';

import React, { Component, Fragment, ComponentType } from 'react';
import {
    View,
    Text,
    Image,
    ImageBackground,
    InteractionManager,
    Alert,
    ViewProps,
    ImageBackgroundProps,
} from 'react-native';

import {
    Navigation,
    EventSubscription,
    OptionsModalPresentationStyle,
    OptionsModalTransitionStyle,
} from 'react-native-navigation';
import { AccountService, NetworkService, StyleService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel, NetworkModel } from '@store/models';

import { XAppOrigin } from '@common/libs/payload';

import { AppScreens, AppConfig } from '@common/constants';

import { XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import Preferences from '@common/libs/preferences';

import RNTangemSdk, { EventCallback } from 'tangem-sdk-react-native';

import { Button, Spacer, RaisedButton, LoadingIndicator } from '@components/General';
import {
    MonetizationElement,
    ProBadge,
    NetworkSwitchButton,
    AccountSwitchElement,
    InactiveAccount,
    AssetsList,
} from '@components/Modules';

import Localize from '@locale';

import { SendViewProps } from '@screens/Send';
import { AccountAddViewProps } from '@screens/Account/Add';
import { ShareAccountOverlayProps } from '@screens/Overlay/ShareAccount';

import { AppStyles } from '@theme';
import styles from './styles';
import onboardingStyles from '../Onboarding/styles';
import { AccountGenerateViewProps } from '@screens/Account/Add/Generate';
import { AccountImportViewProps } from '@screens/Account/Add/Import';
import { ButtonItem } from '@components/General/SegmentButtons/ButtonItem';

/* types ==================================================================== */
export interface Props {
    timestamp: number;
}

export interface State {
    account: AccountModel;
    isSpendable: boolean;
    isSignable: boolean;
    selectedNetwork: NetworkModel;
    developerMode: boolean;
    discreetMode: boolean;
    experimentalUI?: boolean;
    NFCSupported: boolean;
    NFCEnabled: boolean;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;

    private navigationListener: EventSubscription | undefined;
    private nfcChangeListener?: EventSubscription;

    static options() {
        return { topBar: { visible: false } };
    }

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            NFCSupported: false,
            NFCEnabled: false,
            account: coreSettings.account,
            isSpendable: false,
            isSignable: false,
            selectedNetwork: coreSettings.network,
            developerMode: coreSettings.developerMode,
            discreetMode: coreSettings.discreetMode,
            experimentalUI: undefined,
        };
    }

    componentDidMount() {
        // update UI on accounts update
        AccountRepository.on('accountUpdate', this.onAccountUpdate);
        // update discreetMode and developerMode on change
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);

        // listen for screen appear event
        this.navigationListener = Navigation.events().bindComponent(this);

        // update account status
        InteractionManager.runAfterInteractions(this.updateAccountStatus);

        // get experimental status
        Preferences.get(Preferences.keys.EXPERIMENTAL_SIMPLICITY_UI)
            .then((experimentalUI) => {
                this.setState({
                    experimentalUI: experimentalUI === 'true',
                });
            })
            .catch(() => {
                this.setState({
                    experimentalUI: false,
                });
            });


        InteractionManager.runAfterInteractions(() => {
            this.nfcChangeListener = RNTangemSdk.addListener('NFCStateChange', this.onNFCStateChange);
            // on NFC state change (Android)

            // get current NFC status
            RNTangemSdk.getNFCStatus().then((status) => {
                const { support, enabled } = status;

                this.setState({
                    NFCSupported: support,
                    NFCEnabled: enabled,
                });
            });
        });
    }

    onNFCStateChange = ({ enabled }: EventCallback) => {
        this.setState({
            NFCEnabled: enabled,
        });
    };

    componentWillUnmount() {
        // remove listeners
        if (this.navigationListener) {
            this.navigationListener.remove();
        }

        AccountRepository.off('accountUpdate', this.onAccountUpdate);
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);

        if (this.nfcChangeListener) {
            this.nfcChangeListener.remove();
        }

        RNTangemSdk.stopSession().catch(() => {
            // ignore
        });
    }

    componentDidAppear() {
        const { account } = this.state;

        InteractionManager.runAfterInteractions(() => {
            // Update account details when component didAppear and Socket is connected
            if (account?.isValid() && NetworkService.isConnected()) {
                // only update current account details
                AccountService.updateAccountsDetails([account.address]);
            }
        });
    }

    /*
        Handle events when something in CoreSettings has been changed
        Monitoring `discreetMode`, `developerMode`, `defaultNode` changes
     */
    onCoreSettingsUpdate = (coreSettings: CoreModel, changes: Partial<CoreModel>) => {
        const { discreetMode } = this.state;

        // default account changed
        if (has(changes, 'account')) {
            this.setState(
                {
                    account: coreSettings.account,
                },
                // when default account changed update account status
                this.updateAccountStatus,
            );
        }

        // default discreetMode has changed
        if (has(changes, 'discreetMode') && discreetMode !== changes.discreetMode) {
            this.setState({
                discreetMode: coreSettings.discreetMode,
            });
        }

        // developer mode or default node has been changed
        if (has(changes, 'developerMode') || has(changes, 'network')) {
            this.setState(
                {
                    developerMode: coreSettings.developerMode,
                    selectedNetwork: coreSettings.network,
                },
                this.updateAccountStatus,
            );
        }
    };

    onAccountUpdate = (updatedAccount: AccountModel) => {
        const { account } = this.state;

        if (updatedAccount?.isValid() && updatedAccount.address === account.address) {
            // update the UI
            this.setState(
                {
                    account: updatedAccount,
                },
                // when account balance changed update spendable accounts
                this.updateAccountStatus,
            );
        }
    };

    updateAccountStatus = () => {
        const { account } = this.state;

        if (account?.isValid()) {
            const spendableAccounts = AccountRepository.getSpendableAccounts();
            const isSignable = AccountRepository.isSignable(account);

            this.setState({
                account,
                isSignable,
                isSpendable: !!find(spendableAccounts, { address: account.address }),
            });
        }
    };

    showExchangeAccountAlert = () => {
        Alert.alert(Localize.t('global.warning'), Localize.t('home.exchangeAccountReadonlyExplain'));
    };

    onShowAccountQRPress = () => {
        const { isSignable } = this.state;

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
            Navigator.showOverlay<ShareAccountOverlayProps>(AppScreens.Overlay.ShareAccount, { account });
        }
    };

    pushSendScreen = () => {
        Navigator.push<SendViewProps>(AppScreens.Transaction.Payment, {});
    };

    pushSwapScreen = () => {
        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: AppConfig.xappIdentifiers.swap,
                noSwitching: true,
                altHeader: {
                    left: {
                        icon: 'IconChevronLeft',
                        onPress: 'onClose',
                    },
                    center: {
                        text: Localize.t('global.swap'),
                        showNetworkLabel: true,
                    },
                    right: {
                        icon: 'IconTabBarSettingsSelected',
                        iconSize: 25,
                        onPress: 'navigateTo',
                        onPressOptions: {
                            xApp: AppConfig.xappIdentifiers.swap,
                            pickSwapper: true,
                        },
                    },
                },
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
            },
        );
    };

    pushTokenScreen = () => {
        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: AppConfig.xappIdentifiers.tokens,
                noSwitching: true,
                altHeader: {
                    left: {
                        icon: 'IconChevronLeft',
                        onPress: 'onClose',
                    },
                    center: {
                        text: Localize.t('global.assets'),
                        showNetworkLabel: true,
                    },
                },
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
            },
        );
    };

    onAddAccountPress = () => {
        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
    };

    onCreateAccountPress = () => {
        Navigator.push<AccountGenerateViewProps>(AppScreens.Account.Generate, {});
    };

    onImportAccountPress = () => {
        Navigator.push<AccountImportViewProps>(AppScreens.Account.Import, {});
    };

    onTangemAccountPress = () => {
        let resolveNavigationPromise: (value: void | PromiseLike<void>) => void;
        const navigationPromise = new Promise<void>((resolve) => {
            resolveNavigationPromise = resolve;
        });

        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {
            DefaultTangem: true,
            NavigationReadyPromise: navigationPromise,
        }).then(() => resolveNavigationPromise());
    };

    renderHeader = () => {
        const { account, developerMode } = this.state;
        const { timestamp } = this.props;

        return (
            <Fragment key={`header-${timestamp}`}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.flexStart]}>
                    <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                    <ProBadge />
                </View>
                <NetworkSwitchButton developerMode={developerMode} hidden={!account?.isValid()} />
            </Fragment>
        );
    };

    renderMonetization = () => {};

    renderAssets = () => {
        const { timestamp } = this.props;
        const { account, discreetMode, isSpendable, experimentalUI, selectedNetwork } = this.state;

        if ((account?.details || []).length === 0 || account.getStateVersion() === 0) {
            // No account information loaded/cached yet, so not saying "not activated"
            return (
                <View style={AppStyles.flex1}>
                    <LoadingIndicator size='large' />
                </View>
            );
        }

        // accounts is not activated
        if (account.balance === 0) {
            return <InactiveAccount account={account} />;
        }

        return (
            <AssetsList
                experimentalUI={experimentalUI}
                account={account}
                network={selectedNetwork}
                discreetMode={discreetMode}
                spendable={isSpendable}
                timestamp={timestamp}
                addTokenPress={this.pushTokenScreen}
                style={styles.tokenListContainer}
            />
        );
    };

    renderButtons = () => {
        const { isSpendable, experimentalUI, isSignable } = this.state;

        if (isSpendable) {
            return (
                <View style={styles.buttonRow}>
                    <RaisedButton
                        small
                        testID="send-button"
                        containerStyle={styles.sendButtonContainer}
                        icon="IconV2Send"
                        iconSize={18}
                        iconStyle={[
                            styles.sendButtonIcon,
                            styles.iconRotateY,
                        ]}
                        label={Localize.t('global.send')}
                        textStyle={styles.sendButtonText}
                        onPress={this.pushSendScreen}
                    />
                    { NetworkService.hasSwap() && isSignable &&
                        <RaisedButton
                            small
                            testID="swap-button"
                            containerStyle={styles.swapButtonContainer}
                            icon="IconV2Swap"
                            iconSize={18}
                            iconStyle={styles.sendButtonIcon}
                            label={Localize.t('global.swap')}
                            textStyle={styles.sendButtonText}
                            onPress={this.pushSwapScreen}
                        />
                    }
                    <RaisedButton
                        small
                        testID="request-button"
                        containerStyle={
                            experimentalUI ? styles.requestButtonContainerClean : styles.requestButtonContainer
                        }
                        icon="IconV2Request"
                        iconSize={18}
                        iconStyle={[
                            styles.iconRotateX,
                            experimentalUI ? styles.requestButtonIconClean : styles.requestButtonIcon,
                        ]}
                        label={Localize.t('global.request')}
                        textStyle={experimentalUI ? styles.requestButtonTextClean : styles.requestButtonText}
                        onPress={this.onShowAccountQRPress}
                    />
                </View>
            );
        }

        return (
            <View style={styles.buttonRow}>
                <RaisedButton
                    small
                    testID="show-account-qr-button"
                    icon="IconQR"
                    iconSize={20}
                    label={Localize.t('account.showAccountQR')}
                    textStyle={styles.QRButtonText}
                    onPress={this.onShowAccountQRPress}
                />
            </View>
        );
    };

    renderEmpty = () => {
        const { NFCSupported, NFCEnabled } = this.state;

        return (
            <View testID="home-tab-empty-view" style={AppStyles.tabContainer}>
                {/* <View style={styles.headerContainer}>{this.renderHeader()}</View> */}

                <ImageBackground
                    resizeMode="cover"
                    source={StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes')}
                    style={[AppStyles.contentContainer, AppStyles.paddingHorizontal]}
                >
                    <View style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.padding]}>
                        <Image
                            style={onboardingStyles.logo}
                            source={StyleService.getImageIfLightModeIfDarkMode('XamanLogo', 'XamanLogoLight')}
                        />
                    </View>
                    <View style={[
                        AppStyles.flex2,
                    ]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingSml]}>
                            <View style={[AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <Text style={[AppStyles.h5, AppStyles.strong]}>
                                    {Localize.t('onboarding.v2homepage_noacc1')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.colorGrey, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.v2homepage_noacc2')}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={[
                        AppStyles.flex5,
                        AppStyles.paddingBottom,
                    ]}>
                        <View style={[
                            onboardingStyles.container,
                        ]}>
                            <Button
                                testID="add-account-button"
                                label={Localize.t('account.generateNewAccount')}
                                icon="IconCreate"
                                iconStyle={AppStyles.imgColorWhite}
                                nonBlock
                                onPress={this.onCreateAccountPress}
                            />
                            <Spacer size={12} />
                            <Button
                                testID="add-account-button-import"
                                label={Localize.t('account.importExisting')}
                                icon="IconImport"
                                iconStyle={AppStyles.imgColorWhite}
                                nonBlock
                                secondary
                                onPress={this.onImportAccountPress}
                            />
                            { 
                                NFCSupported && NFCEnabled && (
                                    <View>
                                        <Spacer size={12}/>
                                        <Text style={[
                                            AppStyles.textCenterAligned,
                                            AppStyles.smalltext,
                                            AppStyles.bold,
                                            AppStyles.colorGrey,
                                        ]}>{Localize.t('global.or').toUpperCase()}</Text>
                                        <Spacer size={12}/>
                                        <Button
                                            testID="add-account-button-tangem"
                                            label={Localize.t('account.addTangemCard')}
                                            icon="IconTangem"
                                            iconStyle={AppStyles.imgColorContrast}
                                            nonBlock
                                            contrast
                                            onPress={this.onTangemAccountPress}
                                        />
                                    </View>
                                )
                            }

                            <Spacer size={12} />
                        </View>
                    </View>
                </ImageBackground>
            </View>
        );
    };

    renderNetworkDetails = () => {
        const { developerMode, selectedNetwork, experimentalUI } = this.state;

        if (!developerMode || !selectedNetwork || typeof experimentalUI === 'undefined' || experimentalUI) {
            return null;
        }

        return (
            <View style={styles.networkDetailsContainer}>
                <Text style={styles.networkTextLabel}>{Localize.t('global.connectedTo')} </Text>
                <Text adjustsFontSizeToFit numberOfLines={1} style={styles.networkTextContent}>
                    {selectedNetwork.defaultNode.endpoint}
                </Text>
            </View>
        );
    };

    renderAccountAddress = () => {
        const { account, discreetMode } = this.state;

        return (
            <View style={[
                styles.accountSwitchConainer,
            ]}>
                <AccountSwitchElement
                    account={account}
                    discreet={discreetMode}
                    showAddAccountButton
                    noPadding
                    containerStyle={styles.accountSwitchElement}
                />
            </View>
        );
    };

    renderDegenWarning = () => {
        const { account } = this.state;

        if (typeof account?.additionalInfoString === 'string') {
            if (account?.additionalInfoString.startsWith('{"degenMode":')) {
                return (
                    <View style={[
                        AppStyles.buttonRed,
                        AppStyles.borderRadius,
                        AppStyles.marginHorizontalSml,
                        styles.degenWarning,
                        AppStyles.row,
                    ]}>
                        <Text style={[
                            // AppStyles.p,
                            // AppStyles.strong,
                            // AppStyles.textCenterAligned,
                            styles.degenWarningText,
                            AppStyles.flex6,
                        ]}>
                            {Localize.t('account.degenBackUpHomeWrn')}
                        </Text>
                        <Button
                            roundedSmall
                            onPress={() => {
                                const secret = (JSON.parse(account?.additionalInfoString || '{}')?.degenMode || '')
                                    .split('.');

                                Navigator.push<AccountGenerateViewProps>(AppScreens.Account.Generate, {
                                    initial: {
                                        step: 'ViewPrivateKey',
                                        secretNumbers: secret,
                                    },
                                });
                            }} 
                            label={Localize.t('account.degenBackUpNowBtn')}
                            style={[
                                AppStyles.buttonRed,
                                styles.backUpButton,
                            ]}
                        />
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const { account } = this.state;

        if (!account?.isValid()) {
            return this.renderEmpty();
        }

        const Container: ComponentType<ViewProps | ImageBackgroundProps> = account.balance === 0
            ? ImageBackground
            : View;

        const containerProps = account.balance === 0
            ? {
                resizeMode: 'cover',
                source: StyleService.getImageIfLightModeIfDarkMode('BackgroundShapesLight', 'BackgroundShapes'),
            }
            : {
                // Nada for `View`
            };

        return (
            <View testID="home-tab-view" style={AppStyles.tabContainer}>
                {/* Header */}
                <View style={styles.headerContainer}>{this.renderHeader()}</View>

                {/* Monetization */}
                <Fragment key="monetization">
                    <MonetizationElement style={styles.monetizationContainer} />
                </Fragment>

                {/* Content */}
                {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                <Container style={AppStyles.contentContainer} {...containerProps}>
                    {this.renderNetworkDetails()}
                    {this.renderDegenWarning()}
                    {this.renderAccountAddress()}
                    {this.renderButtons()}
                    {this.renderAssets()}
                </Container>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeView;
