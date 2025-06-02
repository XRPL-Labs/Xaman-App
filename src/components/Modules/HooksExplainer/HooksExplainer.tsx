import { get, isEmpty } from 'lodash';

import React, { Component } from 'react';

import { WebLinks } from '@common/constants/endpoints';

import { Payload } from '@common/libs/payload';

import NetworkService from '@services/NetworkService';
import StyleService from '@services/StyleService';

import { Transactions as TransactionsType, FallbackTransaction } from '@common/libs/ledger/transactions/types';

import { WebView, WebViewBrowser } from '@components/General/WebView';

import { AccountModel } from '@store/models';

import Localize from '@locale';

import { AppSizes } from '@theme';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { Alert, Linking, Share } from 'react-native';
import { StringTypeCheck } from '@common/utils/string';
import NavigationService from '@services/NavigationService';
/* Types ==================================================================== */

export enum HookExplainerOrigin {
    TransactionDetails = 'TransactionDetails',
    ReviewPayload = 'ReviewPayload',
}

interface Props {
    account: AccountModel;
    payload?: Payload;
    transaction?: TransactionsType | FallbackTransaction;
    origin?: HookExplainerOrigin;
}

interface State {
    containerHeight: number;
}

/* Component ==================================================================== */
class HooksExplainer extends Component<Props, State> {
    private readonly webView: React.RefObject<typeof WebViewBrowser>;

    constructor(props: Props) {
        super(props);

        this.webView = React.createRef();

        this.state = {
            containerHeight: AppSizes.scale(150),
        };
    }

    getSource = (returnParamsOnly = false) => {
        const { account, payload, transaction, origin } = this.props;

        const params = {
            network: NetworkService.getNetwork().key,
            node: NetworkService.connection?.getState()?.server, 
            style: StyleService.getCurrentTheme(),
        };

        if (payload) {
            Object.assign(params, {
                payload_uuid: payload.getPayloadUUID(),
            });
        }

        // The size of tx_data by a sample transaction using different methods
        // LOG  Hex.Encode     1792
        // LOG  JSON.stringify 896
        // LOG  codec.encode   646
        if (transaction) {
            Object.assign(params, {
                tx_hash: transaction.hash,
                tx_data: returnParamsOnly
                    ? transaction?.JsonRaw || transaction.JsonForSigning
                    : JSON.stringify(transaction.JsonForSigning),
                tx_metadata: returnParamsOnly ? transaction.MetaData : JSON.stringify(transaction.MetaData),
            });
        }

        if (account) {
            Object.assign(params, {
                account: account.address,
            });
        }

        if (origin) {
            Object.assign(params, {
                origin,
            });
        }

        if (returnParamsOnly) {
            return params;
        }

        return {
            uri: `${WebLinks.HooksExplainerURL}/${Localize.getCurrentLocale()}`,
            // uri: `https://dev.wietse.com/app/webviews/hooks/${Localize.getCurrentLocale()}`,
            method: 'POST',
            body: JSON.stringify(params),
            headers: {
                'User-Agent': 'Xaman',
                'Content-Type': 'application/json',
            },
        };
    };

    openBrowserLink = (url: string) => {
        if (!url) {
            return;
        }

        if (!StringTypeCheck.isValidURL(url)) {
            return;
        }

        Linking.openURL(url).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
        });
    };

    openTxDetails = async (hash: string) => {
        const { account, transaction } = this.props;

        let delay = 0;

        if (NavigationService.getCurrentModal() === AppScreens.Transaction.Details) {
            await Navigator.dismissModal();
            delay = 300;
        }

        setTimeout(() => {
            Navigator.showModal(AppScreens.Modal.TransactionLoader, {
                hash: hash || transaction?.hash || '',
                account,
                network: NetworkService.getNetwork(),
            });
        }, delay);
    };

    shareContent = (text: string) => {
        if (typeof text !== 'string' || isEmpty(text)) {
            return;
        }

        // show share dialog
        Share.share({
            message: text,
        }).catch(() => {
            // ignore
        });
    };

    onMessage = (event: any) => {
        try {
            const parsedData = JSON.parse(get(event, 'nativeEvent.data', {}));
            const layoutHeight = get(parsedData, 'layout.height');
            const command = get(parsedData, 'command');

            // we use this so the height of the container can be set by xApp running behind the explainer
            if (typeof layoutHeight === 'number') {
                this.setState({
                    containerHeight: layoutHeight,
                });
            }

            if (command === 'getparams') {
                if (this.webView.current) {
                    this.webView.current.postMessage(JSON.stringify({
                        command: 'getparams',
                        ...this.getSource(true),
                    }));
                }
            }

            if (command === 'share') {
                const text = get(parsedData, 'data');
                this.shareContent(text);
            }

            if (command === 'tx') {
                this.openTxDetails(get(parsedData, 'hash'));
            }

            if (command === 'browser') {
                this.openBrowserLink(get(parsedData, 'url'));
            }

        } catch {
            // something is not right, just ignore ?
        }
    };

    render() {
        const { containerHeight } = this.state;

        return (
            <WebViewBrowser
                ref={this.webView}
                source={this.getSource()}
                onMessage={this.onMessage}
                style={{ height: containerHeight }}
                errorMessage={Localize.t('events.unableToLoadExplainer')}
            />
        );
    }
}

export default HooksExplainer;
