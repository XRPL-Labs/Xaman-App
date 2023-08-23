/**
 * XApp Browser modal
 */

import { assign, get, has, isEmpty, toUpper } from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import {
    Alert,
    BackHandler,
    InteractionManager,
    Linking,
    NativeEventSubscription,
    Share,
    Text,
    View,
} from 'react-native';
import VeriffSdk from '@veriff/react-native-sdk';
import { StringType } from 'xumm-string-decode';
import { utils as AccountLibUtils } from 'xrpl-accountlib';

import { AppConfig, AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/app';

import { Payload, PayloadOrigin } from '@common/libs/payload';
import { Destination } from '@common/libs/ledger/parser/types';
import { AccountInfoType } from '@common/helpers/resolver';

import { StringTypeCheck } from '@common/utils/string';

import AuthenticationService, { LockStatus } from '@services/AuthenticationService';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel, NetworkModel } from '@store/models';
import { AccessLevels } from '@store/types';

import { BackendService, NavigationService, PushNotificationsService, StyleService } from '@services';

import { Avatar, Button, LoadingIndicator, PulseAnimation, Spacer, WebView } from '@components/General';
import { XAppBrowserHeader } from '@components/Modules';

import Localize from '@locale';

// style
import { AppColors, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    identifier: string;
    params?: any;
    title?: string;
    icon?: string;
    account?: AccountModel;
    origin?: PayloadOrigin;
    originData?: any;
}

export interface State {
    title: string;
    icon: string;
    identifier: string;
    supportUrl: string;
    account: AccountModel;
    network: NetworkModel;
    ott: string;
    error: string;
    permissions: any;
    isFetchingOTT: boolean;
    isLoadingApp: boolean;
    isAppReady: boolean;
    isAppReadyTimeout: boolean;
    coreSettings: CoreModel;
    appVersionCode: string;
}

export enum XAppMethods {
    SelectDestination = 'selectDestination',
    OpenSignRequest = 'openSignRequest',
    PayloadResolved = 'payloadResolved',
    XAppNavigate = 'xAppNavigate',
    OpenBrowser = 'openBrowser',
    TxDetails = 'txDetails',
    KycVeriff = 'kycVeriff',
    ScanQr = 'scanQr',
    // eslint-disable-next-line @typescript-eslint/no-shadow
    Share = 'share',
    Close = 'close',
    Ready = 'ready',
}

export enum XAppSpecialPermissions {
    UrlLaunchNoConfirmation = 'URL_LAUNCH_NO_CONFIRMATION',
}

/* Component ==================================================================== */
class XAppBrowserModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.XAppBrowser;

    private backHandler: NativeEventSubscription;

    private readonly webView: React.RefObject<WebView>;

    private lastMessageReceived: number;
    private softLoadingTimeout: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            title: props.title,
            icon: props.icon,
            identifier: props.identifier,
            supportUrl: undefined,
            account: props.account || CoreRepository.getDefaultAccount(),
            network: coreSettings.network,
            ott: undefined,
            error: undefined,
            permissions: undefined,
            isFetchingOTT: true,
            isLoadingApp: false,
            isAppReady: false,
            isAppReadyTimeout: false,
            coreSettings,
            appVersionCode: GetAppVersionCode(),
        };

        this.webView = React.createRef();

        this.backHandler = undefined;

        this.lastMessageReceived = 0;
    }

    componentDidMount() {
        // disable android back button on xApp browser
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        // fetch OTT on browser start
        InteractionManager.runAfterInteractions(this.fetchOTT);

        // listen for authentication lock state changes
        AuthenticationService.on('lockStateChange', this.onLockStateChange);
    }

    componentWillUnmount() {
        // clear listeners
        if (this.backHandler) {
            this.backHandler.remove();
        }

        AuthenticationService.off('lockStateChange', this.onLockStateChange);
    }

    onLockStateChange = (lockState: LockStatus) => {
        if (lockState === LockStatus.LOCKED) {
            // dismiss the WebView keyboard if any
            this.webView?.current?.endEditing();
        }
    };

    onClose = (data?: { refreshEvents?: boolean }) => {
        // if refresh events flag set, publish a sign request update event
        // this will refresh the event list
        if (get(data, 'refreshEvents', false)) {
            setTimeout(() => {
                PushNotificationsService.emit('signRequestUpdate');
            }, 1000);
        }

        // close the xApp modal
        Navigator.dismissModal();

        return true;
    };

    sendEvent = (event: any) => {
        setTimeout(() => {
            if (this.webView.current) {
                this.webView.current.postMessage(JSON.stringify(event));
            }
        }, 250);
    };

    handleSignRequest = async (data: any) => {
        // get payload uuid from data
        const uuid = get(data, 'uuid', undefined);

        // validate the uuid is valid uuidv4
        if (!StringTypeCheck.isValidUUID(uuid)) {
            return;
        }

        try {
            // fetch the payload
            const payload = await Payload.from(uuid, PayloadOrigin.XAPP);

            // review the transaction
            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                    onResolve: this.onPayloadResolve,
                    onDecline: this.onPayloadDecline,
                },
                { modalPresentationStyle: 'fullScreen' },
            );
        } catch (e: any) {
            Alert.alert(Localize.t('global.error'), e.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    onPayloadResolve = (transaction: any, payload: Payload) => {
        this.sendEvent({ method: XAppMethods.PayloadResolved, reason: 'SIGNED', uuid: payload.getPayloadUUID() });
    };

    onPayloadDecline = (payload: Payload) => {
        this.sendEvent({ method: XAppMethods.PayloadResolved, reason: 'DECLINED', uuid: payload.getPayloadUUID() });
    };

    onScannerRead = (data: string) => {
        this.sendEvent({ method: XAppMethods.ScanQr, qrContents: data, reason: 'SCANNED' });
    };

    onScannerClose = () => {
        this.sendEvent({ method: XAppMethods.ScanQr, qrContents: null, reason: 'USER_CLOSE' });
    };

    onDestinationSelect = (destination: Destination, info: AccountInfoType) => {
        this.sendEvent({ method: XAppMethods.SelectDestination, destination, info, reason: 'SELECTED' });
    };

    onDestinationClose = () => {
        this.sendEvent({ method: XAppMethods.SelectDestination, destination: null, info: null, reason: 'USER_CLOSE' });
    };

    showScanner = () => {
        Navigator.showModal(
            AppScreens.Modal.Scan,
            {
                onRead: this.onScannerRead,
                onClose: this.onScannerClose,
                blackList: [StringType.XrplSecret, StringType.XummPairingToken],
            },
            {
                modal: {
                    swipeToDismiss: false,
                },
            },
        );
    };

    showDestinationPicker = (data?: { ignoreDestinationTag?: boolean }) => {
        Navigator.showModal(
            AppScreens.Modal.DestinationPicker,
            {
                onSelect: this.onDestinationSelect,
                onClose: this.onDestinationClose,
                ignoreDestinationTag: get(data, 'ignoreDestinationTag', false),
            },
            {
                modal: {
                    swipeToDismiss: false,
                },
            },
        );
    };

    launchVeriffKyc = async (data: { sessionUrl: string }) => {
        const sessionUrl = get(data, 'sessionUrl', undefined);

        if (!sessionUrl) return;

        try {
            const result = await VeriffSdk.launchVeriff({
                branding: {
                    themeColor: AppColors.blue,
                    buttonCornerRadius: 28,
                },
                sessionUrl,
            });
            // pass the result to the xApp
            this.sendEvent({ method: XAppMethods.KycVeriff, result });
        } catch {
            // ignore
        }
    };

    navigateTo = (data: { xApp: string; title?: string; [key: string]: any }) => {
        const identifier = get(data, 'xApp', undefined);
        const title = get(data, 'title', undefined);

        this.setState(
            {
                identifier,
                title,
                icon: null,
            },
            () => {
                this.fetchOTT(data);
            },
        );
    };

    openBrowserLink = (data: { url: string }, launchDirectly: boolean) => {
        const { title } = this.state;

        const url = get(data, 'url', undefined);

        // url should be only https and contains only a domain url
        if (!StringTypeCheck.isValidURL(url)) {
            return;
        }

        // xApp have the permission to launch the link directly without showing Alert
        if (launchDirectly) {
            Linking.openURL(url).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            });
            return;
        }

        Navigator.showAlertModal({
            type: 'warning',
            title: Localize.t('global.notice'),
            text: Localize.t('global.xAppWantsToOpenURLNotice', { xapp: title, url }),
            buttons: [
                {
                    text: Localize.t('global.cancel'),
                    onPress: () => {},
                    type: 'dismiss',
                    light: true,
                },
                {
                    text: Localize.t('global.continue'),
                    onPress: () => {
                        Linking.openURL(url).catch(() => {
                            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
                        });
                    },
                    light: false,
                },
            ],
        });
    };

    openTxDetails = async (data: { tx: string; account: string }) => {
        const hash = get(data, 'tx', undefined);
        const address = get(data, 'account', undefined);

        // validate inputs
        if (!AccountLibUtils.isValidAddress(address) || !StringTypeCheck.isValidHash(hash)) {
            return;
        }

        // check if account exist in xumm
        const account = AccountRepository.findOne({ address });
        if (!account) return;

        let delay = 0;
        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();
            delay = 300;
        }

        setTimeout(() => {
            Navigator.showModal(AppScreens.Transaction.Details, { hash, account, asModal: true });
        }, delay);
    };

    shareContent = (data: any) => {
        const text = get(data, 'text');

        if (typeof text !== 'string' || isEmpty(text)) {
            return;
        }

        // show share dialog
        Share.share({
            message: text,
        }).catch(() => {});
    };

    handleCommand = (command: XAppMethods, parsedData: any) => {
        const { permissions, isAppReady } = this.state;

        // when there is no permission available just do not run any command
        if (!permissions || isEmpty(get(permissions, 'commands'))) {
            return;
        }

        // check if the xApp have the permission to run this command
        const { commands: AllowedCommands, special: SpecialPermissions } = permissions;

        // xApp doesn't have the permission to run this command
        if (!AllowedCommands.includes(command.toUpperCase())) {
            return;
        }

        // for any command to be run, the app should be in ready state
        // only allow READY command
        if (!isAppReady && command !== XAppMethods.Ready) {
            return;
        }

        // record the command in active methods
        switch (command) {
            case XAppMethods.XAppNavigate:
                this.navigateTo(parsedData);
                break;
            case XAppMethods.KycVeriff:
                this.launchVeriffKyc(parsedData);
                break;
            case XAppMethods.OpenSignRequest:
                this.handleSignRequest(parsedData);
                break;
            case XAppMethods.ScanQr:
                this.showScanner();
                break;
            case XAppMethods.SelectDestination:
                this.showDestinationPicker(parsedData);
                break;
            case XAppMethods.Close:
                this.onClose(parsedData);
                break;
            case XAppMethods.OpenBrowser:
                this.openBrowserLink(
                    parsedData,
                    SpecialPermissions.includes(XAppSpecialPermissions.UrlLaunchNoConfirmation),
                );
                break;
            case XAppMethods.TxDetails:
                this.openTxDetails(parsedData);
                break;
            case XAppMethods.Share:
                this.shareContent(parsedData);
                break;
            case XAppMethods.Ready:
                this.setAppReady();
                break;
            default:
                break;
        }
    };

    onMessage = (event: any) => {
        // should be at least 1500 ms delay between each message
        if (this.lastMessageReceived) {
            if (moment().diff(moment.unix(this.lastMessageReceived), 'millisecond') < 1500) {
                return;
            }
        }

        // record last message received
        this.lastMessageReceived = moment().unix();

        // check if any data is passed
        if (!event || typeof event !== 'object' || !event?.nativeEvent) {
            return;
        }

        // get passed data
        const data = get(event, 'nativeEvent.data');

        // check type of passed data
        if (!data || typeof data !== 'string') {
            return;
        }

        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch {
            // it's not a json object
            return;
        }

        // ignore if no command present or the command is not in expected commands or already is the active method
        if (has(parsedData, 'command') && Object.values(XAppMethods).includes(get(parsedData, 'command'))) {
            const { command } = parsedData;
            this.handleCommand(command, parsedData);
        }
    };

    fetchOTT = async (xAppNavigateData?: any) => {
        const { origin, originData, params } = this.props;
        const { identifier, appVersionCode, account, network, title, coreSettings, isFetchingOTT } = this.state;

        // check if identifier have a valid value
        if (!StringTypeCheck.isValidXAppIdentifier(identifier)) {
            this.setState({
                ott: undefined,
                permissions: undefined,
                isFetchingOTT: false,
                error: 'Provided xApp identifier is not valid!',
            });
            return;
        }

        if (!isFetchingOTT) {
            this.setState({
                isFetchingOTT: true,
            });
        }

        // default headers
        const data = {
            version: appVersionCode,
            locale: Localize.getCurrentLocale(),
            currency: coreSettings.currency,
            style: coreSettings.theme,
            nodetype: network.key,
            nodewss: network.defaultNode.endpoint,
        };

        // assign origin to the headers
        if (origin) {
            assign(data, {
                origin: {
                    type: origin,
                    data: originData,
                },
            });
        }

        if (params) {
            assign(data, params);
        }

        // assign account headers
        if (account) {
            assign(data, {
                account: account.address,
                accounttype: account.type,
                accountaccess: AccountRepository.isSignable(account) ? AccessLevels.Full : AccessLevels.Readonly,
            });
        }

        // assign any extra data
        if (xAppNavigateData) {
            assign(data, { xAppNavigateData });
        }

        BackendService.getXAppLaunchToken(identifier, data)
            .then((res: any) => {
                const { error, ott, xappTitle, xappSupportUrl, icon, permissions } = res;

                // an error reported from backend
                if (error) {
                    this.setState({
                        ott: undefined,
                        permissions: undefined,
                        error,
                    });
                    return;
                }

                // check if the ott is a valid uuid v4
                if (!StringTypeCheck.isValidUUID(ott)) {
                    this.setState({
                        ott: undefined,
                        permissions: undefined,
                        error: 'Provided ott is not valid!',
                    });
                    return;
                }

                // everything is fine
                this.setState({
                    ott,
                    title: xappTitle || title,
                    supportUrl: xappSupportUrl,
                    icon,
                    permissions,
                    isLoadingApp: true,
                    error: undefined,
                });
            })
            .catch(() => {
                this.setState({
                    ott: undefined,
                    permissions: undefined,
                    error: 'FETCH_OTT_FAILED',
                });
            })
            .finally(() => {
                this.setState({
                    isFetchingOTT: false,
                });
            });
    };

    onAccountChange = (account: AccountModel) => {
        this.setState(
            {
                account,
            },
            this.fetchOTT,
        );
    };

    onNetworkChange = (network: NetworkModel) => {
        this.setState(
            {
                network,
            },
            this.fetchOTT,
        );
    };

    getSource = () => {
        const { identifier, ott, coreSettings } = this.state;

        return {
            uri: `https://xumm.app/detect/xapp:${identifier}?xAppToken=${ott}&xAppStyle=${toUpper(coreSettings.theme)}`,
            headers: {
                'X-OTT': ott,
            },
        };
    };

    getUserAgent = () => {
        const { appVersionCode, ott } = this.state;

        // NOTE: we included the ott in the header for the server side xApps to be able to access the ott easier
        // Security risk is really low as the ott details can only be fetched by application and only once
        return `xumm/xapp:${appVersionCode} (ott:${ott})`;
    };

    setAppReady = () => {
        if (this.softLoadingTimeout) {
            clearTimeout(this.softLoadingTimeout);
        }

        this.setState({
            isAppReady: true,
        });
    };

    onSoftLoadingExpire = () => {
        this.setState({
            isAppReadyTimeout: true,
        });
    };

    openDeveloperSupport = () => {
        const { supportUrl } = this.state;

        Linking.openURL(supportUrl).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
        });
    };

    openDonation = (amount?: number) => {
        const { identifier } = this.state;

        this.navigateTo({
            xApp: AppConfig.xappIdentifiers.xappDonation,
            destination: identifier,
            amount,
        });
    };

    onInfoPress = () => {
        const { identifier, title, icon } = this.props;

        Navigator.showOverlay(AppScreens.Overlay.XAppInfo, {
            identifier,
            title,
            icon,
            onDonationPress: this.openDonation,
        });
    };

    onLoadEnd = (e: any) => {
        const { permissions } = this.state;

        const { loading } = e.nativeEvent;

        if (loading) {
            return;
        }

        let shouldSetAppReady = true;

        // when xApp have permission to set the app ready then just wait for the app to set the ready state
        if (Array.isArray(permissions?.commands) && permissions?.commands.includes(toUpper(XAppMethods.Ready))) {
            // set timeout for loading
            if (this.softLoadingTimeout) {
                clearTimeout(this.softLoadingTimeout);
            }
            this.softLoadingTimeout = setTimeout(this.onSoftLoadingExpire, 10000);
            shouldSetAppReady = false;
        }

        // set the app is ready
        this.setState({
            isLoadingApp: false,
            isAppReady: shouldSetAppReady,
        });
    };

    onLoadingError = (e: any) => {
        this.setState({
            error: e.nativeEvent.description || 'An error occurred while loading xApp.',
        });
    };

    renderError = () => {
        const { error } = this.state;

        return (
            <View style={styles.stateContainer}>
                <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.unableToLoadXApp')}</Text>
                <Spacer size={20} />
                <Text style={[AppStyles.monoSubText, AppStyles.textCenterAligned]}>{error}</Text>
                <Spacer size={40} />
                <Button
                    secondary
                    roundedSmall
                    icon="IconRefresh"
                    iconSize={14}
                    onPress={this.fetchOTT}
                    label={Localize.t('global.tryAgain')}
                />
            </View>
        );
    };

    renderLoading = () => {
        const { icon, supportUrl, isAppReadyTimeout, coreSettings } = this.state;

        let LoaderComponent;
        let LoadingStateComponent;

        if (icon) {
            LoaderComponent = (
                <PulseAnimation>
                    <Avatar
                        size={80}
                        source={{ uri: icon }}
                        badgeColor={StyleService.value('$orange')}
                        // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                        containerStyle={{ backgroundColor: 'transparent' }}
                    />
                </PulseAnimation>
            );
        } else {
            LoaderComponent = <LoadingIndicator size="large" />;
        }

        if (isAppReadyTimeout) {
            if (coreSettings.developerMode) {
                LoadingStateComponent = (
                    <View style={AppStyles.padding}>
                        <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                            {Localize.t('xapp.theXAppLoaderHasNotBeenResolved')}
                        </Text>
                        <Spacer />
                        <Button
                            roundedMini
                            secondary
                            onPress={this.setAppReady}
                            label={Localize.t('xapp.forceShowXApp')}
                        />
                    </View>
                );
            } else {
                LoadingStateComponent = (
                    <View style={AppStyles.padding}>
                        <Text style={[AppStyles.baseText, AppStyles.textCenterAligned]}>
                            {Localize.t('xapp.theXAppHasNotBeenFullyLoaded')}
                        </Text>
                        <Spacer />
                        {supportUrl && (
                            <Button
                                roundedMini
                                secondary
                                onPress={this.openDeveloperSupport}
                                label={Localize.t('xapp.contactDeveloper')}
                            />
                        )}
                    </View>
                );
            }
        }

        return (
            <View style={styles.stateContainer}>
                {LoaderComponent}
                {LoadingStateComponent}
            </View>
        );
    };

    renderApp = () => {
        return (
            <WebView
                ref={this.webView}
                containerStyle={styles.webViewContainer}
                style={styles.webView}
                startInLoadingState
                onLoadEnd={this.onLoadEnd}
                onError={this.onLoadingError}
                source={this.getSource()}
                onMessage={this.onMessage}
                userAgent={this.getUserAgent()}
            />
        );
    };

    renderContent = () => {
        const { isFetchingOTT, isLoadingApp, isAppReady, error } = this.state;

        let appView = null;
        let stateView = null;

        // if still fetching OTT only show the loading spinner
        if (!isFetchingOTT) {
            appView = this.renderApp();
        }

        if (isFetchingOTT || isLoadingApp || !isAppReady) {
            stateView = this.renderLoading();
        } else if (error) {
            stateView = this.renderError();
        }

        return (
            <View style={styles.contentContainer}>
                {appView}
                {stateView}
            </View>
        );
    };

    renderHeader = () => {
        const { identifier, title, icon, network, account } = this.state;

        return (
            <XAppBrowserHeader
                identifier={identifier}
                title={title}
                icon={icon}
                account={account}
                network={network}
                onAccountChange={this.onAccountChange}
                onNetworkChange={this.onNetworkChange}
                onClosePress={this.onClose}
                onInfoPress={this.onInfoPress}
            />
        );
    };

    render() {
        return (
            <View testID="xapp-browser-modal" style={styles.container}>
                {this.renderHeader()}
                {this.renderContent()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppBrowserModal;
