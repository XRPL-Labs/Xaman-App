import { get } from 'lodash';

import React, { Component } from 'react';

import { Payload } from '@common/libs/payload';

import NetworkService from '@services/NetworkService';

import { Transactions as TransactionsType } from '@common/libs/ledger/transactions/types';

import { WebViewBrowser } from '@components/General/WebView';

import { AccountModel } from '@store/models';

import Localize from '@locale';

import { AppSizes } from '@theme';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    payload?: Payload;
    transaction?: TransactionsType;
}

interface State {
    containerHeight: number;
}

/* Component ==================================================================== */
class HooksExplainer extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            containerHeight: AppSizes.scale(150),
        };
    }

    getURL = () => {
        const { account, payload, transaction } = this.props;

        const baseURL = `https://xumm.app/app/webviews/hooks/${Localize.getCurrentLocale()}`;

        const params = {
            network: NetworkService.getNetwork().key,
        };

        if (payload) {
            Object.assign(params, {
                payload_uuid: payload.getPayloadUUID(),
            });
        }

        if (transaction) {
            Object.assign(params, {
                tx_hash: transaction.Hash,
                tx_data: transaction.Json,
                tx_metadata: transaction.MetaData,
            });
        }

        if (account) {
            Object.assign(params, {
                account: account.address,
            });
        }

        const urlParams: Array<string> = [];

        Object.keys(params).forEach((k) => {
            // @ts-ignore
            const v = params[k];
            if (!v) {
                return;
            }
            urlParams.push(
                typeof v === 'object'
                    ? `${encodeURIComponent(k)}=${encodeURIComponent(JSON.stringify(v))}`
                    : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
            );
        });

        return `${baseURL}?${urlParams.join('&')}`;
    };

    onMessage = (event: any) => {
        try {
            // get passed data
            const data = get(event, 'nativeEvent.data');

            const parsedData = JSON.parse(data);

            const layoutHeight = get(parsedData, 'layout.height');

            if (typeof layoutHeight === 'number') {
                this.setState({
                    containerHeight: layoutHeight,
                });
            }
        } catch (e) {
            // something is not right
        }
    };

    render() {
        const { containerHeight } = this.state;

        return (
            <WebViewBrowser
                source={{ uri: this.getURL() }}
                onMessage={this.onMessage}
                style={{ height: containerHeight }}
            />
        );
    }
}

export default HooksExplainer;
