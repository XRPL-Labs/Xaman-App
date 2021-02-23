/**
 * XApp Browser modal
 */

import { has, get, assign } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ActivityIndicator, BackHandler, Alert, InteractionManager } from 'react-native';
import VeriffSdk from '@veriff/react-native-sdk';
import { WebView } from 'react-native-webview';
import { StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/device';

import { Payload, PayloadOrigin } from '@common/libs/payload';

import { AppScreens } from '@common/constants';

import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { CoreRepository } from '@store/repositories';

import { SocketService, BackendService } from '@services';

import { Header, Button, Spacer } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    identifier: string;
    title?: string;
    account?: AccountSchema;
    origin?: PayloadOrigin;
    originData?: any;
}

export interface State {
    title: string;
    identifier: string;
    ott: string;
    isLoading: boolean;
    error: string;
    coreSettings: CoreSchema;
    appVersionCode: string;
}

/* Component ==================================================================== */
class XAppBrowserModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.XAppBrowser;
    private backHandler: any;
    private webView: WebView;

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
            ott: undefined,
            error: undefined,
            isLoading: true,
            coreSettings: CoreRepository.getSettings(),
            appVersionCode: GetAppVersionCode(),
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);

        InteractionManager.runAfterInteractions(this.fetchOTT);
    }

    onClose = () => {
        Navigator.dismissModal();
        return true;
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
                { payload },
            );
        } catch (e) {
            Alert.alert(Localize.t('global.error'), e.message, [{ text: 'OK' }], { cancelable: false });
        }
    };

    onScannerRead = (data: string) => {
        if (this.webView) {
            this.webView.postMessage(JSON.stringify({ method: 'scanQr', qrContents: data, reason: 'SCANNED' }));
        }
    };

    onScannerClose = () => {
        if (this.webView) {
            this.webView.postMessage(JSON.stringify({ method: 'scanQr', qrContents: null, reason: 'USER_CLOSE' }));
        }
    };

    showScanner = () => {
        Navigator.showModal(
            AppScreens.Modal.Scan,
            {},
            {
                onRead: this.onScannerRead,
                onClose: this.onScannerClose,
                blackList: [StringType.XrplSecret, StringType.XummPairingToken],
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
            if (this.webView) {
                this.webView.postMessage(JSON.stringify({ method: 'kycVeriff', result }));
            }
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
            this.fetchOTT,
        );
    };

    onMessage = (event: any) => {
        const { data } = event.nativeEvent;
        let parsedData;

        try {
            parsedData = JSON.parse(data);
        } catch {
            // it's not a json object
            return;
        }

        // ignore if no command present
        if (!has(parsedData, 'command')) {
            return;
        }

        switch (get(parsedData, 'command')) {
            case 'xAppNavigate':
                this.navigateTo(parsedData);
                break;
            case 'kycVeriff':
                this.launchVeriffKYC(parsedData);
                break;
            case 'openSignRequest':
                this.handleSignRequest(parsedData);
                break;
            case 'scanQr':
                this.showScanner();
                break;
            case 'close':
                this.onClose();
                break;
            default:
                break;
        }
    };

    fetchOTT = () => {
        const { identifier, account, origin, originData } = this.props;
        const { appVersionCode, coreSettings, isLoading } = this.state;

        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        // default headers
        const data = {
            version: appVersionCode,
            locale: Localize.getCurrentLocale(),
            style: coreSettings.theme,
            nodetype: SocketService.chain,
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

        // assign account headers
        if (account) {
            assign(data, {
                account: account.address,
                accounttype: account.type,
                accountaccess: account.accessLevel,
            });
        }

        BackendService.getXAppLaunchToken(identifier, data)
            .then((res: any) => {
                const { error, ott } = res;

                if (error) {
                    this.setState({
                        ott: undefined,
                        error,
                    });
                } else {
                    this.setState({
                        ott,
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
        const { identifier, ott } = this.state;

        const uri = `https://xumm.app/detect/xapp:${identifier}?xAppToken=${ott}`;

        return uri;
    };

    getUserAgent = () => {
        const { appVersionCode } = this.state;

        return `xumm/xapp:${appVersionCode}`;
    };

    renderLoading = () => {
        return <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />;
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

    render() {
        const { title } = this.state;

        return (
            <View testID="xapp-browser-modal" style={[styles.container]}>
                <Header
                    centerComponent={{ text: title || 'XAPP' }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onClose,
                    }}
                />

                {this.renderContent()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppBrowserModal;
