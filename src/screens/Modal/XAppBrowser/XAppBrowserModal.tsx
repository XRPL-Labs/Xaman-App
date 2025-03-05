/**
 * XApp Browser modal
 */

import { assign, get, has, isEmpty, toUpper } from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import {
    Alert,
    BackHandler,
    Image,
    InteractionManager,
    Linking,
    NativeEventSubscription,
    Share,
    Share as RNShare,
    Text,
    View,
} from 'react-native';

import { NetworkLabel } from '@components/Modules/NetworkLabel';

import VeriffSdk from '@veriff/react-native-sdk';
import { StringType } from 'xumm-string-decode';
import { utils as AccountLibUtils } from 'xrpl-accountlib';
import { OptionsModalPresentationStyle } from 'react-native-navigation';

import { AppConfig, AppScreens } from '@common/constants';
import { HOSTNAME } from '@common/constants/endpoints';

import { Images } from '@common/helpers/images';
import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/app';

import { Payload, PayloadOrigin } from '@common/libs/payload';
import { Destination } from '@common/libs/ledger/parser/types';

import { StringTypeCheck } from '@common/utils/string';

import AuthenticationService, { LockStatus } from '@services/AuthenticationService';
import { AccountAdvisoryResolveType } from '@services/ResolverService';
import NetworkService from '@services/NetworkService';

import { AccountRepository, CoreRepository, NetworkRepository, ProfileRepository } from '@store/repositories';
import { AccountModel, NetworkModel } from '@store/models';
import { AccessLevels } from '@store/types';

import { BackendService, NavigationService, PushNotificationsService, StyleService } from '@services';
import { ApiError } from '@services/ApiService';

import {
    Avatar,
    Button,
    HeartBeatAnimation,
    Icon,
    InfoMessage,
    LoadingIndicator,
    RaisedButton,
    Spacer,
    WebView,
    Header,
} from '@components/General';
import { XAppBrowserHeader } from '@components/Modules';

import Localize from '@locale';

import { AccountAddViewProps } from '@screens/Account/Add';
import { TransactionLoaderModalProps } from '@screens/Modal/TransactionLoader';
import { DisplayButtonTypes, XAppInfoOverlayProps } from '@screens/Overlay/XAppInfo';
import { ScanModalProps } from '@screens/Modal/Scan';
import { DestinationPickerModalProps } from '@screens/Modal/DestinationPicker';
import { ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction';
import { PurchaseProductModalProps } from '@screens/Modal/PurchaseProduct';

import LoggerService from '@services/LoggerService';

import { AppColors, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { IEvent, Props, State, XAppMethods, XAppSpecialPermissions } from './types';

/* Component ==================================================================== */
class XAppBrowserModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.XAppBrowser;

    private backHandler?: NativeEventSubscription;
    private softLoadingTimeout?: ReturnType<typeof setTimeout>;
    private readonly webView: React.RefObject<WebView>;
    private lastMessageReceived: number;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            ott: undefined,
            app: {
                title: props.title,
                icon: props.icon,
                identifier: props.identifier,
                supportUrl: undefined,
                appid: undefined,
                permissions: undefined,
                networks: undefined,
                __ott: undefined,
            },
            account: props.account ?? CoreRepository.getDefaultAccount(),
            network: coreSettings.network,
            error: undefined,
            isLaunchingApp: true,
            isLoadingApp: false,
            isAppReady: false,
            isAppReadyTimeout: false,
            isRequiredNetworkSwitch: false,
            appVersionCode: GetAppVersionCode(),
            coreSettings,
        };

        this.webView = React.createRef();

        // last message received from webview, preventing spamming
        this.lastMessageReceived = 0;
    }

    componentDidMount() {
        // disable android back button on xApp browser
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

        // fetch OTT on browser start
        InteractionManager.runAfterInteractions(this.launchApp);

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
            Navigator.showModal<ReviewTransactionModalProps>(
                AppScreens.Modal.ReviewTransaction,
                {
                    payload,
                    onResolve: this.onPayloadResolve,
                    onDecline: this.onPayloadDecline,
                },
                { modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen },
            );
        } catch (e: any) {
            Alert.alert(Localize.t('global.error'), e.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    sendEvent = (event: IEvent) => {
        setTimeout(() => {
            if (this.webView.current) {
                this.webView.current.postMessage(JSON.stringify(event));
            }
        }, 250);
    };

    onNetworkSwitch = (network: NetworkModel) => {
        this.sendEvent({ method: XAppMethods.NetworkSwitch, network: network.key });
    };

    onKycResolve = (result: any) => {
        this.sendEvent({ method: XAppMethods.KycVeriff, result });
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
        this.sendEvent({ method: XAppMethods.ScanQr, qrContents: undefined, reason: 'USER_CLOSE' });
    };

    onDestinationSelect = (destination: Destination, info: AccountAdvisoryResolveType) => {
        this.sendEvent({ method: XAppMethods.SelectDestination, destination, info, reason: 'SELECTED' });
    };

    onDestinationClose = () => {
        this.sendEvent({
            method: XAppMethods.SelectDestination,
            destination: undefined,
            info: undefined,
            reason: 'USER_CLOSE',
        });
    };

    onInAppPurchaseResolve = (successPurchase: boolean) => {
        this.sendEvent({
            method: XAppMethods.RequestInAppPurchase,
            successPurchase,
        });
    };

    showScanner = () => {
        Navigator.showModal<ScanModalProps>(
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
        Navigator.showModal<DestinationPickerModalProps>(
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
            VeriffSdk.launchVeriff({
                branding: {
                    themeColor: AppColors.blue,
                    buttonCornerRadius: 28,
                },
                sessionUrl,
            })
                .then(this.onKycResolve)
                .catch(() => {
                    // ignore
                });
        } catch {
            // ignore
        }
    };

    requestInAppPurchase = async ({
        productId,
        productDescription,
    }: {
        productId: string;
        productDescription: string;
    }) => {
        Navigator.showModal<PurchaseProductModalProps>(AppScreens.Modal.PurchaseProduct, {
            productId,
            productDescription,
            onClose: this.onInAppPurchaseResolve,
        });
    };

    navigateTo = (data: { xApp: string; title?: string; [key: string]: any }) => {
        const identifier = get(data, 'xApp', undefined);
        const title = get(data, 'title', undefined);

        // identifier is not provided, just ignore the command
        if (!identifier) {
            return;
        }

        // clean up
        if (this.softLoadingTimeout) {
            clearTimeout(this.softLoadingTimeout);
        }

        this.setState(
            {
                ott: undefined,
                app: {
                    identifier,
                    title,
                    icon: undefined,
                    supportUrl: undefined,
                    permissions: undefined,
                    networks: undefined,
                    __ott: undefined,
                },
                error: undefined,
                isLaunchingApp: true,
                isLoadingApp: false,
                isAppReady: false,
                isAppReadyTimeout: false,
                isRequiredNetworkSwitch: false,
            },
            () => {
                this.launchApp(data);
            },
        );
    };

    getLogs = () => {
        Navigator.showAlertModal({
            type: 'warning',
            title: Localize.t('global.notice'),
            text: Localize.t('global.xAppWantsToSendSessionLogs'),
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
                        const result = LoggerService.getLogs();
                        this.sendEvent({ method: XAppMethods.GetLogs, result });                
                    },
                    light: false,
                },
            ],
        });
    };

    openBrowserLink = (data: { url: string }, launchDirectly: boolean) => {
        const { app } = this.state;

        const url = get(data, 'url', undefined);

        // param is not provided, ignore
        if (!url || !app) {
            return;
        }

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
            text: Localize.t('global.xAppWantsToOpenURLNotice', { xapp: app.title, url }),
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
        const { network } = this.state;

        const hash = get(data, 'tx', undefined);
        const address = get(data, 'account', undefined);

        // no param is provided
        if (!address || !hash) {
            return;
        }

        // validate inputs
        if (!AccountLibUtils.isValidAddress(address) || !StringTypeCheck.isValidHash(hash)) {
            return;
        }

        // check if account exist in Xaman
        const account = AccountRepository.findOne({ address });
        if (!account) return;

        let delay = 0;
        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();
            delay = 300;
        }

        setTimeout(() => {
            Navigator.showModal<TransactionLoaderModalProps>(AppScreens.Modal.TransactionLoader, {
                hash,
                account,
                network,
            });
        }, delay);
    };

    shareContent = (data: { text: string }) => {
        const text = get(data, 'text');

        if (typeof text !== 'string' || isEmpty(text)) {
            return;
        }

        // show share dialog
        RNShare.share({
            message: text,
        }).catch(() => {
            // ignore
        });
    };

    handleCommand = (command: XAppMethods, parsedData: any) => {
        const { app, isAppReady, coreSettings } = this.state;

        // no xapp is initiated ?
        // check if it's a know command
        if (!app || !Object.values(XAppMethods).includes(command)) {
            return;
        }

        // when there is no permission available just do not run any command or the command is unknown for us
        if (!app.permissions || isEmpty(get(app.permissions, 'commands'))) {
            return;
        }

        // check if the xApp have the permission to run this command
        const { commands: AllowedCommands, special: SpecialPermissions } = app.permissions;

        // xApp doesn't have the permission to run this command
        // ignore ready command
        if (!AllowedCommands.includes(command.toUpperCase())) {
            // show alert about command
            if (coreSettings.developerMode && command !== XAppMethods.Ready) {
                Alert.alert(
                    Localize.t('global.error'),
                    Localize.t('xapp.xAppDoesNotHavePermissionToRunThisCommand', { command }),
                );
            }
            return;
        }

        // for any command to be run, the app should be in ready state
        // only allow READY command
        if (!isAppReady && command !== XAppMethods.Ready) {
            if (coreSettings.developerMode) {
                Alert.alert(Localize.t('global.error'), Localize.t('xapp.appReadyToAcceptCommands'));
            }
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
            case XAppMethods.GetLogs:
                this.getLogs();
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
            case XAppMethods.RequestInAppPurchase:
                this.requestInAppPurchase(parsedData);
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

    launchApp = async (xAppNavigateData?: any) => {
        const { origin, originData, params } = this.props;
        const { app, appVersionCode, account, network, coreSettings, isLaunchingApp } = this.state;

        // double check
        if (!app) {
            throw new Error('launchApp, app is required!');
        }

        try {
            // check if identifier have a valid value
            if (!StringTypeCheck.isValidXAppIdentifier(app.identifier)) {
                throw new Error('Provided xApp identifier is not valid!');
            }

            if (!isLaunchingApp) {
                this.setState({
                    isLaunchingApp: true,
                });
            }

            // get xapp info
            const xAppInfo = await BackendService.getXAppInfo(app.identifier);

            if (!xAppInfo?.networks || !Array.isArray(xAppInfo?.networks)) {
                throw new Error('Unable to check for the xApp supported networks!');
            }

            const { networks } = xAppInfo;

            // user is not connected to the expected network
            if (!networks.includes(NetworkService.getNetwork().key)) {
                // user is not connected to the supported networks
                // show network selection view
                this.setState({
                    app: {
                        ...app,
                        networks: xAppInfo.networks,
                    },
                    isLaunchingApp: false,
                    isRequiredNetworkSwitch: true,
                });
            }

            // default headers
            const data: XamanBackend.XappLunchDataType = {
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

            // if there is any param, we include it
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

            // if there is any original ott for this app include it
            if (app?.__ott) {
                assign(data, {
                    xAppNavigateData: {
                        ...data.xAppNavigateData,
                        __ott: app.__ott,
                    },
                });
            }

            const response = await BackendService.getXAppLaunchToken(app.identifier, data);
            const { error, ott, xappTitle, xappSupportUrl, icon, permissions, appid } = response;

            // an error reported from backend
            if (error) {
                throw new Error(error);
            }

            // check if the ott is a valid uuid v4
            if (!StringTypeCheck.isValidUUID(ott)) {
                throw new Error('Provided ott is not valid from response!');
            }

            // everything is fine
            this.setState({
                ott,
                app: {
                    identifier: app.identifier,
                    title: xappTitle || app?.title,
                    appid: appid || app?.appid,
                    supportUrl: xappSupportUrl,
                    icon,
                    permissions,
                    networks,
                    __ott: app?.__ott || ott,
                },
                isLaunchingApp: false,
                isLoadingApp: true,
                error: undefined,
            });
        } catch (error: any) {
            this.setState({
                ott: undefined,
                isLaunchingApp: false,
                error,
            });
        }
    };

    onAccountChange = (account: AccountModel) => {
        this.setState(
            {
                account,
            },
            this.launchApp,
        );
    };

    /**
     * Handles network change event.
     * @param {NetworkModel} network - The network object representing the new network.
     * @returns {void}
     */
    onNetworkChange = (network: NetworkModel): void => {
        const { app } = this.state;

        const networks = app?.networks ?? [];
        const SpecialPermissions = app?.permissions?.special ?? [];

        // if we are going to send event instead of re-lunching the xapp
        // beforehand we need to make sure user on the right network
        const isRequiredNetworkSwitch = !networks.includes(network.key);

        this.setState({ network, isRequiredNetworkSwitch }, () => {
            if (!isRequiredNetworkSwitch) {
                const isRequiredNoConfirmUrlLaunch = SpecialPermissions.includes(
                    XAppSpecialPermissions.NetworkSwitchEventNoReload,
                );

                // do not re-lunch the app and send event instead send event to the xapp
                if (isRequiredNoConfirmUrlLaunch) {
                    // send the network switch event
                    this.onNetworkSwitch(network);
                } else {
                    InteractionManager.runAfterInteractions(this.launchApp);
                }
            }
        });
    };

    /**
     * Retrieves the source information for the xapp load.
     *
     * @returns {Object} - The source information.
     * @property {string} uri - The URI for the xapp.
     * @property {Object} headers - The headers for the xapp.
     * @property {string} headers.X-OTT - The X-OTT header for authentication.
     */
    getSource = (): { uri: string; headers?: any } => {
        const { app, ott, coreSettings } = this.state;

        // app is not initiated?
        if (!app) {
            return { uri: '#' };
        }

        return {
            uri: `https://${HOSTNAME}/detect/xapp:${app?.appid || app.identifier}?xAppToken=${ott}&xAppStyle=${toUpper(
                coreSettings.theme,
            )}`,
            headers: {
                'X-OTT': ott,
            },
        };
    };

    /**
     * Retrieves the user agent string for the current application version and ott token.
     *
     * @returns {string} The user agent string in the format `xumm/xapp:{appVersionCode} (ott:{ott})`.
     */
    getUserAgent = (): string => {
        const { appVersionCode, ott } = this.state;

        // NOTE: we included the ott in the header for the server side xApps to be able to access the ott easier
        // Security risk is really low as the ott details can only be fetched by application and only once
        return `xumm/xapp:${appVersionCode} (ott:${ott})`;
    };

    /**
     * Set the application ready state.
     * Clears the soft loading timeout if it exists and sets the isAppReady state to true.
     *
     * @function setAppReady
     * @returns {void}
     */
    setAppReady = (): void => {
        if (this.softLoadingTimeout) {
            clearTimeout(this.softLoadingTimeout);
        }

        this.setState({
            isAppReady: true,
        });
    };

    /**
     * Called when the soft loading expires.
     * Sets the 'isAppReadyTimeout' state to true.
     * @return {void}
     */
    onSoftLoadingExpire = (): void => {
        this.setState({
            isAppReadyTimeout: true,
        });
    };

    /**
     * Opens developer support URL.
     */
    openDeveloperSupport = () => {
        const { app } = this.state;

        // double check
        if (!app?.supportUrl) {
            return;
        }

        Linking.openURL(app.supportUrl).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
        });
    };

    /**
     * Opens the donation page with an optional amount.
     *
     * @param {number} [amount] - The amount to pre-fill in donation form.
     * @returns {void}
     */
    openDonation = (amount?: number): void => {
        const { app } = this.state;

        // double check
        if (!app?.supportUrl) {
            return;
        }

        this.navigateTo({
            xApp: AppConfig.xappIdentifiers.xappDonation,
            destination: app.identifier,
            amount,
        });
    };

    shareXApp = () => {
        const { app } = this.state;

        const { identifier, title } = app!;

        Share.share({
            title,
            message: `https://${HOSTNAME}/detect/xapp:${identifier}`,
            url: undefined,
        });
    };

    lunchMonetization = () => {
        const profile = ProfileRepository.getProfile();

        // no profile found
        if (!profile) {
            return;
        }

        const { monetization } = profile;

        Navigator.showModal<PurchaseProductModalProps>(AppScreens.Modal.PurchaseProduct, {
            productId: monetization.productForPurchase!,
            productDescription: monetization.monetizationType!,
            onClose: (successPayment: boolean) => {
                if (successPayment) {
                    this.launchApp();
                }
            },
        });
    };

    onInfoPress = () => {
        const { identifier, title, icon } = this.props;

        Navigator.showOverlay<XAppInfoOverlayProps>(AppScreens.Overlay.XAppInfo, {
            identifier,
            title: title!,
            icon: icon!,
            displayButtonTypes: [DisplayButtonTypes.DONATION, DisplayButtonTypes.SHARE],
            onDonationPress: this.openDonation,
            onSharePress: this.shareXApp,
        });
    };

    onAddAccountPress = async () => {
        // close the browser modal and redirect user to add account screen
        await Navigator.dismissModal();

        // push to the screen
        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
    };

    onLoadEnd = (e: any) => {
        const { app } = this.state;
        const { loading } = e.nativeEvent;

        // still loading ?
        if (loading) {
            return;
        }

        let shouldSetAppReady = true;

        // when xApp have permission to set the app ready then just wait for the app to set the ready state
        if (
            Array.isArray(app?.permissions?.commands) &&
            app?.permissions?.commands.includes(toUpper(XAppMethods.Ready))
        ) {
            // set timeout for loading
            if (this.softLoadingTimeout) {
                clearTimeout(this.softLoadingTimeout);
            }
            this.softLoadingTimeout = setTimeout(this.onSoftLoadingExpire, 10000);
            shouldSetAppReady = false;
        }

        // set the app is ready
        this.setState({
            isLoadingApp: !shouldSetAppReady,
            isAppReady: shouldSetAppReady,
        });
    };

    onLoadingError = (e: any) => {
        this.setState({
            error: e.nativeEvent.description || 'An error occurred while loading xApp.',
        });
    };

    renderNoAccount = () => {
        return (
            <View style={styles.stateContainer}>
                <Icon name="IconInfo" style={styles.infoIcon} size={80} />
                <Spacer size={18} />
                <Text style={AppStyles.h5}>{Localize.t('global.noAccountConfigured')}</Text>
                <Spacer size={18} />
                <InfoMessage
                    type="neutral"
                    label={Localize.t('global.pleaseAddAccountToAccessXApp')}
                    containerStyle={styles.actionContainer}
                    actionButtonLabel={Localize.t('account.addAccount')}
                    actionButtonIcon="IconPlus"
                    actionButtonIconSize={17}
                    onActionButtonPress={this.onAddAccountPress}
                />
            </View>
        );
    };

    renderError = () => {
        const { error } = this.state;

        if (error instanceof ApiError && error.code === 402) {
            return (
                <View style={styles.stateContainer}>
                    <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.unableToLoadXApp')}</Text>
                    <View style={styles.paymentRequiredContainer}>
                        <Text style={styles.paymentText}>{Localize.t('monetization.paymentRequiredMessage')}</Text>
                        <View style={AppStyles.row}>
                            <RaisedButton
                                small
                                onPress={this.lunchMonetization}
                                label={Localize.t('monetization.learnMore')}
                                containerStyle={styles.actionButtonContainer}
                                textStyle={styles.actionButtonLabel}
                            />
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.stateContainer}>
                <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.unableToLoadXApp')}</Text>
                <Spacer size={20} />
                <Text style={[AppStyles.monoSubText, AppStyles.textCenterAligned]}>{error?.message}</Text>
                <Spacer size={40} />
                <Button
                    secondary
                    roundedSmall
                    icon="IconRefresh"
                    iconSize={14}
                    onPress={this.launchApp}
                    label={Localize.t('global.tryAgain')}
                />
            </View>
        );
    };

    renderLoading = () => {
        const { app, isAppReadyTimeout, coreSettings } = this.state;

        let LoaderComponent;
        let LoadingStateComponent;

        if (app?.icon) {
            LoaderComponent = (
                <HeartBeatAnimation animated={!isAppReadyTimeout}>
                    <Avatar
                        size={80}
                        source={{ uri: app.icon }}
                        badgeColor={StyleService.value('$orange')}
                        // eslint-disable-next-line react-native/no-color-literals,react-native/no-inline-styles
                        containerStyle={{
                            backgroundColor: 'transparent',
                            opacity: isAppReadyTimeout ? 0.2 : 1,
                        }}
                    />
                </HeartBeatAnimation>
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
                        {app?.supportUrl && (
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

    renderNetworkSwitch = () => {
        const { app } = this.state;

        const supportedNetworks = [];

        const networks = NetworkRepository.findAll();

        for (const network of networks) {
            if (app?.networks?.includes(network.key)) {
                supportedNetworks.push(network);
            }
        }

        return (
            <View style={styles.errorContainer}>
                <Image source={Images.ImageArrowUp} style={styles.arrowUpImage} />
                <Spacer size={18} />
                <Text style={[AppStyles.baseText, AppStyles.bold, AppStyles.textCenterAligned]}>
                    {Localize.t('xapp.xAppSupportNetworkError')}
                </Text>
                <Spacer size={18} />
                <Text style={styles.networkSwitchSubtext}>{Localize.t('xapp.switchToSupportedNetworks')}</Text>
                <Spacer size={18} />
                {supportedNetworks.map((network) => (
                    <Text key={`${network.id}`} style={styles.supportedNetworkName}>
                        {network.name}
                    </Text>
                ))}
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
        const { account, isLaunchingApp, isLoadingApp, isAppReady, isRequiredNetworkSwitch, error } = this.state;

        // no account configured
        if (!account) {
            return this.renderNoAccount();
        }

        let appView = null;
        let stateView = null;

        // if still fetching OTT only show the loading spinner
        if (!isLaunchingApp) {
            if (isRequiredNetworkSwitch) {
                appView = this.renderNetworkSwitch();
            } else {
                appView = this.renderApp();
            }
        }

        if ((isLaunchingApp || isLoadingApp) && !isAppReady && !isRequiredNetworkSwitch) {
            stateView = this.renderLoading();
        } else if (error) {
            stateView = this.renderError();
            appView = null;
        }

        return (
            <View style={styles.contentContainer}>
                {appView}
                {stateView}
            </View>
        );
    };

    renderHeader = () => {
        const { app, network, account } = this.state;
        const { noSwitching, nativeTitle } = this.props;

        if (nativeTitle && nativeTitle !== '') {
            return (
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onClose,
                    }}
                    centerComponent={{ text: nativeTitle, extraComponent: <NetworkLabel type="both" /> }}
                    rightComponent={ String(app?.identifier || '') === 'xaman.swap' ? {
                        icon: 'IconTabBarSettingsSelected',
                        iconSize: 25,
                        onPress: () => {
                            this.navigateTo({
                                xApp: AppConfig.xappIdentifiers.swap,
                                pickSwapper: true,
                            });
                        },
                    } : undefined }
                />
            );
        }

        return (
            <XAppBrowserHeader
                identifier={app?.identifier}
                title={app?.title}
                icon={app?.icon}
                noSwitching={!!noSwitching}
                nativeTitle={nativeTitle}
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
