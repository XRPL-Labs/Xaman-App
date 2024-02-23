import { has, get, isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AccountModel } from '@store/models';
import { Payload, PayloadOrigin, XAppOrigin } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';
import { FormatTime } from '@common/utils/date';

import { AppScreens } from '@common/constants';

import { TouchableDebounce, Avatar } from '@components/General';

import Localize from '@locale';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    item: Payload;
    timestamp?: number;
}

export interface State {
    transactionLabel?: string;
    description?: string;
}

export enum RequestType {
    SignRequest = 'SignRequest',
    OpenXApp = 'OpenXApp',
}

/* Component ==================================================================== */
class RequestItem extends Component<Props, State> {
    static Height = AppSizes.heightPercentageToDP(7.5);

    constructor(props: Props) {
        super(props);

        this.state = {
            transactionLabel: undefined,
            description: undefined,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { item, timestamp } = this.props;
        const { transactionLabel, description } = this.state;

        return (
            !isEqual(nextProps.item?.getPayloadUUID(), item?.getPayloadUUID()) ||
            !isEqual(nextState.transactionLabel, transactionLabel) ||
            !isEqual(nextState.description, description) ||
            !isEqual(nextProps.timestamp, timestamp)
        );
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setDetails);
    }

    componentDidUpdate(prevProps: Props) {
        const { item, timestamp } = this.props;

        // force the lookup if timestamp changed
        if (timestamp !== prevProps.timestamp || item?.getPayloadUUID() !== prevProps.item?.getPayloadUUID()) {
            InteractionManager.runAfterInteractions(this.setDetails);
        }
    }

    openXApp = () => {
        const { item } = this.props;

        const xappIdentifier = get(item, 'payload.request_json.xappIdentifier');
        const title = get(item, 'payload.request_json.xappTitle', 'xApp');
        const originData = { payload: get(item, 'meta.uuid') };

        if (xappIdentifier) {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    title,
                    identifier: xappIdentifier,
                    origin: XAppOrigin.EVENT_LIST,
                    originData,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        }
    };

    openSignRequest = () => {
        const { item } = this.props;

        // set payload origin
        if (item.getOrigin() !== PayloadOrigin.EVENT_LIST) {
            item.setOrigin(PayloadOrigin.EVENT_LIST);
        }

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            { payload: item },
            { modalPresentationStyle: 'fullScreen' },
        );
    };

    onPress = () => {
        switch (this.getType()) {
            case RequestType.OpenXApp:
                this.openXApp();
                break;
            case RequestType.SignRequest:
                this.openSignRequest();
                break;
            default:
                break;
        }
    };

    setDetails = () => {
        const { item } = this.props;

        let transactionLabel;
        let description;

        if (this.getType() === RequestType.OpenXApp) {
            transactionLabel = Localize.t('global.xapp');
        } else {
            transactionLabel = item.getTransactionType();
        }

        switch (this.getType()) {
            case RequestType.OpenXApp:
                description = get(item, 'payload.request_json.xappTitle', Localize.t('global.openForDetails'));
                break;
            case RequestType.SignRequest:
                description = Localize.t('global.signRequest');
                break;
            default:
                description = Localize.t('global.signRequest');
                break;
        }

        this.setState({
            transactionLabel,
            description,
        });
    };

    getType = (): RequestType => {
        const { item } = this.props;

        if (get(item, 'payload.tx_type') === 'SignIn' && has(item, 'payload.request_json.xappIdentifier')) {
            return RequestType.OpenXApp;
        }

        return RequestType.SignRequest;
    };

    getRequestTime = () => {
        const { item } = this.props;

        return FormatTime(item.getRequestTime());
    };

    render() {
        const { item } = this.props;
        const { transactionLabel, description } = this.state;

        return (
            <TouchableDebounce
                onPress={this.onPress}
                activeOpacity={0.6}
                style={[styles.container, { height: RequestItem.Height }]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Avatar border source={{ uri: item.getApplicationIcon() }} />
                </View>
                <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                    <Text style={styles.label}>{item.getApplicationName()}</Text>
                    <Text style={styles.description}>
                        <Text style={styles.transactionLabel}>{transactionLabel}</Text>&nbsp; - &nbsp;
                        {description}
                    </Text>
                </View>
                <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent]}>
                    <Text style={styles.requestTimeText}>{this.getRequestTime()}</Text>
                </View>
            </TouchableDebounce>
        );
    }
}

export default RequestItem;
