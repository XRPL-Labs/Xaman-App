/**
 * Home Screen
 */

import { find, has } from 'lodash';

import React, { Component, Fragment } from 'react';
import { View, Text, Image, ImageBackground, InteractionManager, Alert } from 'react-native';

import { Navigation, EventSubscription } from 'react-native-navigation';

import { AccountService, NetworkService, StyleService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel, NetworkModel } from '@store/models';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import Preferences from '@common/libs/preferences';

import { Button, RaisedButton } from '@components/General';
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
    experimentalUI: boolean;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;

    private navigationListener: EventSubscription | undefined;

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
            account: coreSettings.account,
            isSpendable: false,
            isSignable: false,
            selectedNetwork: coreSettings.network,
            developerMode: coreSettings.developerMode,
            discreetMode: coreSettings.discreetMode,
            experimentalUI: false,
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
        Preferences.get(Preferences.keys.EXPERIMENTAL_SIMPLICITY_UI).then((experimentalUI) => {
            if (experimentalUI === 'true') {
                this.setState({
                    experimentalUI: true,
                });
            }
        });
    }

    componentWillUnmount() {
        // remove listeners
        if (this.navigationListener) {
            this.navigationListener.remove();
        }

        AccountRepository.off('accountUpdate', this.onAccountUpdate);
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    componentDidAppear() {
        const { account } = this.state;

        InteractionManager.runAfterInteractions(() => {
            // Update account details when component didAppear and Socket is connected
            if (account?.isValid() && NetworkService.isConnected()) {
                // only update current account details
                AccountService.updateAccountsDetails(account.address);
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

    onAddAccountPress = () => {
        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
    };

    renderHeader = () => {
        const { account } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.flexStart]}>
                    <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                    <ProBadge />
                </View>
                <NetworkSwitchButton hidden={!account?.isValid()} />
            </Fragment>
        );
    };

    renderMonetization = () => {};

    renderAssets = () => {
        const { timestamp } = this.props;
        const { account, discreetMode, isSpendable, experimentalUI } = this.state;

        // accounts is not activated
        if (account.balance === 0) {
            return <InactiveAccount account={account} />;
        }

        return (
            <AssetsList
                experimentalUI={experimentalUI}
                account={account}
                discreetMode={discreetMode}
                spendable={isSpendable}
                timestamp={timestamp}
                style={styles.tokenListContainer}
            />
        );
    };

    renderButtons = () => {
        const { isSpendable, experimentalUI } = this.state;

        if (isSpendable) {
            return (
                <View style={styles.buttonRow}>
                    <RaisedButton
                        small
                        testID="send-button"
                        containerStyle={styles.sendButtonContainer}
                        icon="IconCornerLeftUp"
                        iconSize={18}
                        iconStyle={styles.sendButtonIcon}
                        label={Localize.t('global.send')}
                        textStyle={styles.sendButtonText}
                        onPress={this.pushSendScreen}
                    />
                    <RaisedButton
                        small
                        testID="request-button"
                        containerStyle={
                            experimentalUI ? styles.requestButtonContainerGrey : styles.requestButtonContainer
                        }
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
        return (
            <View testID="home-tab-empty-view" style={AppStyles.tabContainer}>
                <View style={styles.headerContainer}>{this.renderHeader()}</View>

                <ImageBackground
                    source={StyleService.getImage('BackgroundShapes')}
                    imageStyle={AppStyles.BackgroundShapes}
                    style={[AppStyles.contentContainer, AppStyles.padding]}
                >
                    <Image style={AppStyles.emptyIcon} source={StyleService.getImage('ImageFirstAccount')} />
                    <Text style={AppStyles.emptyText}>{Localize.t('home.emptyAccountAddFirstAccount')}</Text>
                    <Button
                        testID="add-account-button"
                        label={Localize.t('home.addAccount')}
                        icon="IconPlus"
                        iconStyle={AppStyles.imgColorWhite}
                        rounded
                        onPress={this.onAddAccountPress}
                    />
                </ImageBackground>
            </View>
        );
    };

    renderNetworkDetails = () => {
        const { developerMode, selectedNetwork, experimentalUI } = this.state;

        if (!developerMode || !selectedNetwork || experimentalUI) {
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
            <AccountSwitchElement
                account={account}
                discreet={discreetMode}
                showAddAccountButton
                containerStyle={styles.accountSwitchElement}
            />
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

                {/* Monetization */}
                <Fragment key="monetization">
                    <MonetizationElement style={styles.monetizationContainer} />
                </Fragment>

                {/* Content */}
                <View style={AppStyles.contentContainer}>
                    {this.renderNetworkDetails()}
                    {this.renderAccountAddress()}
                    {this.renderButtons()}
                    {this.renderAssets()}
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeView;
