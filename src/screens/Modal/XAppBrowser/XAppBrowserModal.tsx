/**
 * XApp Browser modal
 */

import { has, get, assign, toUpper, isEmpty } from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import {
    View,
    Text,
    BackHandler,
    Alert,
    InteractionManager,
    Linking,
    Share,
    NativeEventSubscription,
} from 'react-native';
import VeriffSdk from '@veriff/react-native-sdk';
import { StringType } from 'xumm-string-decode';
import { utils as AccountLibUtils } from 'xrpl-accountlib';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/app';

import { Payload, PayloadOrigin } from '@common/libs/payload';
import { Destination } from '@common/libs/ledger/parser/types';
import { AccountInfoType } from '@common/helpers/resolver';

import { StringTypeCheck } from '@common/utils/string';

import { AppScreens } from '@common/constants';

import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccessLevels, NodeChain } from '@store/types';

import { SocketService, BackendService, PushNotificationsService, NavigationService, StyleService } from '@services';

import { WebView, Button, Spacer, LoadingIndicator, Avatar, PulseAnimation } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    identifier: string;
    params?: any;
    title?: string;
    icon?: string;
    account?: AccountSchema;
    origin?: PayloadOrigin;
    originData?: any;
}

export interface State {
    title: string;
    icon: string;
    identifier: string;
    account: AccountSchema;
    ott: string;
    error: string;
    permissions: any;
    isFetchingOTT: boolean;
    isLoadingApp: boolean;

    isAppReady: boolean;
    coreSettings: CoreSchema;
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
    private lastMessageReceived: number;
    private readonly webView: React.RefObject<WebView>;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            title: props.title,
            icon: props.icon,
            identifier: props.identifier,
            account: props.account || AccountRepository.getDefaultAccount(),
            ott: undefined,
            error: undefined,
            permissions: undefined,
            isFetchingOTT: true,
            isLoadingApp: false,
            isAppReady: false,
            coreSettings: CoreRepository.getSettings(),
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
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

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

    showDestinationPicker = () => {
        Navigator.showModal(
            AppScreens.Modal.DestinationPicker,
            {
                onSelect: this.onDestinationSelect,
                onClose: this.onDestinationClose,
            },
            {
                modal: {
                    swipeToDismiss: false,
                },
            },
        );
    };

    launchVeriffKYC = async (data: any) => {
        const { sessionUrl } = data;

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

    navigateTo = (data: any) => {
        const { xApp, title } = data;

        this.setState(
            {
                identifier: xApp,
                title,
            },
            () => {
                this.fetchOTT(data);
            },
        );
    };

    openBrowserLink = (data: any, launchDirectly: boolean) => {
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

    openTxDetails = async (data: any) => {
        const hash = get(data, 'tx');
        const address = get(data, 'account');

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
        const { permissions } = this.state;

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

        // record the command in active methods
        switch (command) {
            case XAppMethods.XAppNavigate:
                this.navigateTo(parsedData);
                break;
            case XAppMethods.KycVeriff:
                this.launchVeriffKYC(parsedData);
                break;
            case XAppMethods.OpenSignRequest:
                this.handleSignRequest(parsedData);
                break;
            case XAppMethods.ScanQr:
                this.showScanner();
                break;
            case XAppMethods.SelectDestination:
                this.showDestinationPicker();
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
        const { identifier, appVersionCode, account, title, coreSettings, isFetchingOTT } = this.state;

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
            nodetype: SocketService.chain,
        };

        // include node endpoint if using custom node
        if (SocketService.chain === NodeChain.Custom) {
            assign(data, {
                nodewss: SocketService.node,
            });
        }

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
                const { error, ott, xappTitle, icon, permissions } = res;

                // check if the ott is a valid uuid v4
                if (!StringTypeCheck.isValidUUID(ott)) {
                    this.setState({
                        ott: undefined,
                        permissions: undefined,
                        error: 'Provided ott is not valid!',
                    });
                    return;
                }

                // an error reported from backend
                if (error) {
                    this.setState({
                        ott: undefined,
                        permissions: undefined,
                        error,
                    });
                    return;
                }

                // everything is fine
                this.setState({
                    ott,
                    title: xappTitle || title,
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
        const { appVersionCode } = this.state;

        return `xumm/xapp:${appVersionCode}`;
    };

    setAppReady = () => {
        this.setState({
            isAppReady: true,
        });
    };

    onLoadEnd = () => {
        const { permissions } = this.state;

        let shouldSetAppReady = true;

        // when xApp have permission to set the app ready then just wait for the app to set the ready state
        if (get(permissions, `commands.${toUpper(XAppMethods.Ready)}`)) {
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
        const { icon } = this.state;

        if (icon) {
            return (
                <PulseAnimation containerStyle={styles.stateContainer}>
                    <Avatar size={80} source={{ uri: icon }} badgeColor={StyleService.value('$orange')} />
                </PulseAnimation>
            );
        }

        return <LoadingIndicator style={styles.stateContainer} size="large" />;
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
        const { title } = this.state;

        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerTitle}>
                    <Text numberOfLines={1} style={AppStyles.h5}>
                        {title || 'Loading...'}
                    </Text>
                </View>
                <View style={styles.headerButton}>
                    <Button
                        contrast
                        testID="close-button"
                        numberOfLines={1}
                        roundedSmall
                        label={Localize.t('global.quitXApp')}
                        onPress={this.onClose}
                    />
                </View>
            </View>
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
