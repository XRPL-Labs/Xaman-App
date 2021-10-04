/**
 * XApp Browser modal
 */

import { has, get, assign, toUpper } from 'lodash';
import moment from 'moment-timezone';
import React, { Component } from 'react';
import {
    View,
    Text,
    BackHandler,
    Alert,
    InteractionManager,
    Linking,
    Platform,
    NativeEventSubscription,
} from 'react-native';
import VeriffSdk from '@veriff/react-native-sdk';
import { WebView } from 'react-native-webview';
import { StringType } from 'xumm-string-decode';
import { utils as AccountLibUtils } from 'xrpl-accountlib';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/device';
import { Prompt } from '@common/helpers/interface';

import { Payload, PayloadOrigin } from '@common/libs/payload';
import { Destination } from '@common/libs/ledger/parser/types';
import { AccountInfoType } from '@common/helpers/resolver';

import { AppScreens } from '@common/constants';

import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccessLevels, NodeChain } from '@store/types';

import { SocketService, BackendService, PushNotificationsService, NavigationService } from '@services';

import { Button, Spacer, LoadingIndicator } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    identifier: string;
    params?: any;
    title?: string;
    account?: AccountSchema;
    origin?: PayloadOrigin;
    originData?: any;
}

export interface State {
    title: string;
    identifier: string;
    account: AccountSchema;
    ott: string;
    isLoading: boolean;
    error: string;
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
    Close = 'close',
}

/* Component ==================================================================== */
class XAppBrowserModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.XAppBrowser;

    private webView: WebView;
    private backHandler: NativeEventSubscription;
    private lastMessageReceived: number;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            title: props.title,
            identifier: props.identifier,
            account: props.account || AccountRepository.getDefaultAccount(),
            ott: undefined,
            error: undefined,
            isLoading: true,
            coreSettings: CoreRepository.getSettings(),
            appVersionCode: GetAppVersionCode(),
        };

        this.backHandler = undefined;

        this.lastMessageReceived = 0;
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        // handle back button in android
        if (Platform.OS === 'android') {
            this.backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        }

        // fetch OTT on browser start
        InteractionManager.runAfterInteractions(this.fetchOTT);
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
            if (this.webView) {
                this.webView.postMessage(JSON.stringify(event));
            }
        }, 250);
    };

    handleSignRequest = async (data: any) => {
        if (!has(data, 'uuid')) {
            return;
        }

        const uuid = get(data, 'uuid');

        // validate passed data is uuid
        const uuidRegExp = new RegExp('^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$', 'i');
        if (typeof uuid !== 'string' || !uuidRegExp.test(uuid)) {
            return;
        }

        try {
            // fetch the payload
            const payload = await Payload.from(uuid, PayloadOrigin.XAPP);

            // review the transaction
            Navigator.showModal(
                AppScreens.Modal.ReviewTransaction,
                { modalPresentationStyle: 'fullScreen' },
                {
                    payload,
                    onResolve: this.onPayloadResolve,
                    onDecline: this.onPayloadDecline,
                },
            );
        } catch (e: any) {
            Alert.alert(Localize.t('global.error'), e.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    onPayloadResolve = () => {
        this.sendEvent({ method: XAppMethods.PayloadResolved, reason: 'SIGNED' });
    };

    onPayloadDecline = () => {
        this.sendEvent({ method: XAppMethods.PayloadResolved, reason: 'DECLINED' });
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
                modal: {
                    swipeToDismiss: false,
                },
            },
            {
                onRead: this.onScannerRead,
                onClose: this.onScannerClose,
                blackList: [StringType.XrplSecret, StringType.XummPairingToken],
            },
        );
    };

    showDestinationPicker = () => {
        Navigator.showModal(
            AppScreens.Modal.DestinationPicker,
            {
                modal: {
                    swipeToDismiss: false,
                },
            },
            {
                onSelect: this.onDestinationSelect,
                onClose: this.onDestinationClose,
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

    openBrowserLink = (data: any) => {
        const { title } = this.state;

        const { url } = data;

        if (!url) return;

        // eslint-disable-next-line no-control-regex
        const urlRegex = new RegExp('^https://[a-zA-Z0-9][a-zA-Z0-9-.]+[a-zA-Z0-9].[a-zA-Z]{1,}[?/]{0,3}[^\r\n\t]+');

        // url should be only https and contains only a domain url
        if (!urlRegex.test(url)) return;

        Prompt(
            Localize.t('global.notice'),
            Localize.t('global.xAppWantsToOpenURLNotice', { xapp: title, url }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: 'Open',
                    onPress: () => {
                        Linking.canOpenURL(url).then((supported) => {
                            if (supported) {
                                Linking.openURL(url);
                            } else {
                                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
                            }
                        });
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    openTxDetails = async (data: any) => {
        const hash = get(data, 'tx');
        const address = get(data, 'account');

        // validate inputs
        if (!AccountLibUtils.isValidAddress(address) || !new RegExp('^[A-F0-9]{64}$', 'i').test(hash)) return;

        // check if account exist in xumm
        const account = AccountRepository.findOne({ address });
        if (!account) return;

        let delay = 0;
        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();
            delay = 300;
        }

        setTimeout(() => {
            Navigator.showModal(AppScreens.Transaction.Details, {}, { hash, account, asModal: true });
        }, delay);
    };

    handleCommand = (parsedData: any) => {
        // record the command in active methods
        switch (get(parsedData, 'command')) {
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
                this.openBrowserLink(parsedData);
                break;
            case XAppMethods.TxDetails:
                this.openTxDetails(parsedData);
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

        if (!event || typeof event !== 'object' || !event?.nativeEvent) {
            return;
        }
        // get passed data
        const data = get(event, 'nativeEvent.data');

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
            // everything seems fine pass the data to the handlers
            this.handleCommand(parsedData);
        }
    };

    fetchOTT = (xAppNavigateData?: any) => {
        const { origin, originData, params } = this.props;
        const { identifier, appVersionCode, account, title, coreSettings, isLoading } = this.state;

        if (!isLoading) {
            this.setState({
                isLoading: true,
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
                const { error, ott, xappTitle } = res;

                if (error) {
                    this.setState({
                        ott: undefined,
                        error,
                    });
                } else {
                    this.setState({
                        ott,
                        title: xappTitle || title,
                        error: undefined,
                    });
                }
            })
            .catch(() => {
                this.setState({
                    ott: undefined,
                    error: 'FETCH_OTT_FAILED',
                });
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    getUrl = () => {
        const { identifier, ott, coreSettings } = this.state;

        const uri = `https://xumm.app/detect/xapp:${identifier}?xAppToken=${ott}&xAppStyle=${toUpper(
            coreSettings.theme,
        )}`;

        return uri;
    };

    getUserAgent = () => {
        const { appVersionCode } = this.state;

        return `xumm/xapp:${appVersionCode}`;
    };

    renderLoading = () => {
        return <LoadingIndicator style={styles.loadingStyle} size="large" />;
    };

    renderError = () => {
        const { error } = this.state;

        return (
            <View
                style={[
                    AppStyles.flex1,
                    AppStyles.centerAligned,
                    AppStyles.centerContent,
                    AppStyles.paddingHorizontalSml,
                ]}
            >
                <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.unableToLoadXApp')}</Text>
                <Spacer size={20} />
                <Text style={[AppStyles.monoSubText]}>{error}</Text>
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

    renderXApp = () => {
        return (
            <WebView
                ref={(r) => {
                    this.webView = r;
                }}
                containerStyle={styles.webViewContainer}
                startInLoadingState
                renderLoading={this.renderLoading}
                source={{ uri: this.getUrl() }}
                onMessage={this.onMessage}
                userAgent={this.getUserAgent()}
                androidHardwareAccelerationDisabled={false}
            />
        );
    };

    renderContent = () => {
        const { isLoading, error } = this.state;

        if (isLoading) {
            return this.renderLoading();
        }

        if (error) {
            return this.renderError();
        }

        return this.renderXApp();
    };

    renderHeader = () => {
        const { title } = this.state;

        return (
            <View style={[styles.headerContainer]}>
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.paddingLeftSml,
                        AppStyles.paddingRightSml,
                        AppStyles.centerContent,
                    ]}
                >
                    <Text numberOfLines={1} style={AppStyles.h5}>
                        {title || 'XAPP'}
                    </Text>
                </View>
                <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
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
            <View testID="xapp-browser-modal" style={[styles.container]}>
                {this.renderHeader()}
                {this.renderContent()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppBrowserModal;
