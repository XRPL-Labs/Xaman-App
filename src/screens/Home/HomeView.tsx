/**
 * Home Screen
 */

import { find, has } from 'lodash';

import React, { Component, Fragment } from 'react';
import { View, Text, Image, ImageBackground, InteractionManager, Alert } from 'react-native';

import { Navigation } from 'react-native-navigation';

import { AccountService, SocketService, StyleService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema, NetworkSchema } from '@store/schemas/latest';

// constants
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import Localize from '@locale';

// components
import { Button, RaisedButton } from '@components/General';
import { ProBadge, NetworkSwitchButton, AccountSwitchElement, InactiveAccount, AssetsList } from '@components/Modules';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    timestamp: number;
}

export interface State {
    account: AccountSchema;
    isSpendable: boolean;
    isSignable: boolean;
    selectedNetwork: NetworkSchema;
    developerMode: boolean;
    discreetMode: boolean;
}

/* Component ==================================================================== */
class HomeView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Home;
    private navigationListener: any;

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
            account: undefined,
            isSpendable: false,
            isSignable: false,
            selectedNetwork: coreSettings.network,
            developerMode: coreSettings.developerMode,
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

        InteractionManager.runAfterInteractions(this.getDefaultAccount);
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
        if (has(changes, 'developerMode') || has(changes, 'network')) {
            this.setState({
                developerMode: coreSettings.developerMode,
                selectedNetwork: coreSettings.network,
            });
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
                this.updateAccountStatus,
            );
        }
    };

    getDefaultAccount = () => {
        this.setState(
            {
                account: AccountRepository.getDefaultAccount(),
            },
            // when account balance changed update spendable accounts
            this.updateAccountStatus,
        );
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
            Navigator.showOverlay(AppScreens.Overlay.ShareAccount, { account });
        }
    };

    pushSendScreen = () => {
        Navigator.push(AppScreens.Transaction.Payment);
    };

    renderHeader = () => {
        const { account, selectedNetwork } = this.state;

        return (
            <Fragment key="header">
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.flexStart]}>
                    <Image style={styles.logo} source={StyleService.getImage('XummLogo')} />
                    <ProBadge />
                </View>
                <NetworkSwitchButton
                    network={selectedNetwork}
                    hidden={!account?.isValid()}
                    containerStyle={[AppStyles.flex1, AppStyles.centerAligned]}
                />
            </Fragment>
        );
    };

    renderAssets = () => {
        const { timestamp } = this.props;
        const { account, discreetMode, isSpendable } = this.state;

        // accounts is not activated
        if (account.balance === 0) {
            return <InactiveAccount account={account} />;
        }

        return (
            <AssetsList
                account={account}
                discreetMode={discreetMode}
                spendable={isSpendable}
                timestamp={timestamp}
                style={styles.tokenListContainer}
            />
        );
    };

    renderButtons = () => {
        const { isSpendable } = this.state;

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
                        onPress={() => {
                            Navigator.push(AppScreens.Account.Add);
                        }}
                    />
                </ImageBackground>
            </View>
        );
    };

    renderNetworkDetails = () => {
        const { developerMode, selectedNetwork } = this.state;

        if (!developerMode || !selectedNetwork) {
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

        return <AccountSwitchElement account={account} discreet={discreetMode} />;
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
