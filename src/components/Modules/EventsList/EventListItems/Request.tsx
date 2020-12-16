import React, { Component } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';

import { AccountSchema } from '@store/schemas/latest';
import { Payload } from '@common/libs/payload';

import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { Avatar } from '@components/General';

import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: Payload;
}

export interface State {}

/* Component ==================================================================== */
class RequestTemplate extends Component<Props, State> {
    onPress = (item: Payload) => {
        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            { modalPresentationStyle: 'fullScreen' },
            {
                payload: item,
            },
        );
    };

    render() {
        const { item } = this.props;

        return (
            <TouchableHighlight
                onPress={() => {
                    this.onPress(item);
                }}
                underlayColor="#FFF"
            >
                <View style={[AppStyles.row, styles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Avatar size={40} border source={{ uri: item.application.icon_url }} />
                    </View>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Text style={[styles.label]}>{item.application.name}</Text>
                        <Text style={[styles.description]}>Sign Request</Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }
}

export default RequestTemplate;
