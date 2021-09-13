import { has, get, debounce } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { AccountSchema } from '@store/schemas/latest';
import { Payload, PayloadOrigin } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { Avatar } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: Payload;
}

export interface State {}

export enum RequestType {
    SignRequest = 'SignRequest',
    OpenXApp = 'OpenXApp',
}

/* Component ==================================================================== */
class RequestTemplate extends Component<Props, State> {
    openXApp = () => {
        const { item } = this.props;

        const xappIdentifier = get(item, 'payload.request_json.xappIdentifier');
        const title = get(item, 'payload.request_json.xappTitle', 'xApp');
        const originData = { payload: get(item, 'meta.uuid') };

        if (xappIdentifier) {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                {
                    title,
                    identifier: xappIdentifier,
                    origin: PayloadOrigin.EVENT_LIST,
                    originData,
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
            { modalPresentationStyle: 'fullScreen' },
            {
                payload: item,
            },
        );
    };

    debouncedOnPress = () => {
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

    onPress = debounce(this.debouncedOnPress, 1500, { leading: true, trailing: false });

    getType = (): RequestType => {
        const { item } = this.props;

        if (get(item, 'payload.tx_type') === 'SignIn' && has(item, 'payload.request_json.xappIdentifier')) {
            return RequestType.OpenXApp;
        }

        return RequestType.SignRequest;
    };

    getDescription = () => {
        const { item } = this.props;

        switch (this.getType()) {
            case RequestType.OpenXApp:
                return get(item, 'payload.request_json.xappTitle', Localize.t('global.openForDetails'));
            case RequestType.SignRequest:
                return Localize.t('global.signRequest');
            default:
                return Localize.t('global.signRequest');
        }
    };

    render() {
        const { item } = this.props;

        return (
            <TouchableOpacity onPress={this.onPress} activeOpacity={0.6} style={styles.container}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                    <Avatar border source={{ uri: item.application.icon_url }} />
                </View>
                <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                    <Text style={[styles.label]}>{item.application.name}</Text>
                    <Text style={[styles.description]}>{this.getDescription()}</Text>
                </View>
            </TouchableOpacity>
        );
    }
}

export default RequestTemplate;
