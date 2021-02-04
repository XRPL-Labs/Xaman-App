/**
 * XApp Browser modal
 */

import { has, get } from 'lodash';
import React, { Component } from 'react';
import { View, ActivityIndicator, BackHandler, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { hasNotch, GetAppVersionCode } from '@common/helpers/device';

import { Payload, PayloadOrigin } from '@common/libs/payload';

import { AppScreens } from '@common/constants';

import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { CoreRepository } from '@store/repositories';

import { Header } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    uri: string;
    title?: string;
    account?: AccountSchema
    origin?: PayloadOrigin
}

export interface State {
    paddingBottom: number;
    coreSettings: CoreSchema;
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
            paddingBottom: hasNotch() ? 20 : 0,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
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

    getHeaders = () => {
        const { account, origin } = this.props;
        const { coreSettings } = this.state;

        // default headers
        const headers = {
            'X-XUMM-Version': GetAppVersionCode(),
            'X-XUMM-Locale': Localize.getCurrentLocale(),
            'X-XUMM-Style': coreSettings.theme,
        };

        // assign origin to the headers
        if (origin) {
            Object.assign(headers, {
                'X-XUMM-Origin': origin,
            });
        }

        // assign account headers
        if (account) {
                Object.assign(headers, {
                    'X-XUMM-Account': account.address,
                    'X-XUMM-AccountType': account.type,
                    'X-XUMM-AccountAccess': account.accessLevel,
                });
        }

        return headers;
    }

    render() {
        const { uri, title } = this.props;
        const { paddingBottom } = this.state;

        return (
            <View testID="xapp-browser-modal" style={[styles.container]}>
                <Header
                    centerComponent={{ text: title || 'XAPP' }}
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onClose,
                    }}
                />

                <WebView
                    ref={(r) => {
                        this.webView = r;
                    }}
                    containerStyle={[AppStyles.flex1, { paddingBottom }]}
                    startInLoadingState
                    renderLoading={() => (
                        <ActivityIndicator color={AppColors.blue} style={styles.loadingStyle} size="large" />
                    )}
                    source={{ uri, headers: this.getHeaders() }}
                    onMessage={this.onMessage}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppBrowserModal;
