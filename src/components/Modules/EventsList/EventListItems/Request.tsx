import { has, get } from 'lodash';
import React, { Component } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
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

        const url = get(item, 'payload.request_json.xappUrl');

        if (url) {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
                {
                    uri: url,
                    origin: PayloadOrigin.EVENT_LIST,
                },
            );
        }
    };

    openSignRequest = () => {
        const { item } = this.props;

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            { modalPresentationStyle: 'fullScreen' },
            {
                payload: item,
            },
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

    getType = (): RequestType => {
        const { item } = this.props;

        if (get(item, 'payload.tx_type') === 'SignIn' && has(item, 'payload.request_json.xappUrl')) {
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
            <TouchableHighlight onPress={this.onPress} underlayColor="#FFF">
                <View style={[AppStyles.row, styles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Avatar size={40} border source={{ uri: item.application.icon_url }} />
                    </View>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Text style={[styles.label]}>{item.application.name}</Text>
                        <Text style={[styles.description]}>{this.getDescription()}</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }
}

export default RequestTemplate;
