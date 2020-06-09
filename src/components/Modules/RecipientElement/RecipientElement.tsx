import React, { PureComponent } from 'react';
import { View, Text, TouchableHighlight, ImageSourcePropType } from 'react-native';

import { Avatar } from '@components/General/Avatar';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export type RecipientType = {
    id: string;
    avatar: ImageSourcePropType;
    address: string;
    name: string;
    tag: string;
    source: string;
};

interface Props {
    recipient: RecipientType;
    onPress?: () => void;
    selected?: boolean;
}

/* Component ==================================================================== */
class RecipientElement extends PureComponent<Props> {
    onPress = () => {
        const { onPress } = this.props;

        if (onPress && typeof onPress === 'function') {
            onPress();
        }
    };

    render() {
        const { recipient, selected } = this.props;

        let tag;

        switch (recipient.source) {
            case 'xrplns':
                tag = (
                    <View style={[styles.tag, styles.xrplnsTag]}>
                        <Text style={styles.tagLabel}>XRPLNS</Text>
                    </View>
                );
                break;
            case 'bithomp.com':
                tag = (
                    <View style={[styles.tag, styles.bithompTag]}>
                        <Text style={styles.tagLabel}>Bithomp</Text>
                    </View>
                );
                break;
            case 'xrpscan.com':
                tag = (
                    <View style={[styles.tag, styles.xrpscanTag]}>
                        <Text style={styles.tagLabel}>XRPScan</Text>
                    </View>
                );
                break;
            case 'payid':
                tag = (
                    <View style={[styles.tag, styles.payidTag]}>
                        <Text style={styles.tagLabel}>PayID</Text>
                    </View>
                );
                break;
            default:
                break;
        }

        return (
            <TouchableHighlight onPress={this.onPress} underlayColor="#FFF" key={recipient.id}>
                <View style={[styles.itemRow, selected ? styles.itemSelected : null]}>
                    <Avatar source={recipient.avatar} />

                    <View style={AppStyles.paddingLeftSml}>
                        <View style={AppStyles.row}>
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={[styles.title, selected ? styles.selectedText : null]}
                            >
                                {recipient.name || Localize.t('global.noNameFound')}
                            </Text>
                            {tag && tag}
                        </View>
                        <Text style={[styles.subtitle, selected ? styles.selectedText : null]}>
                            {recipient.address}
                        </Text>
                    </View>
                </View>
            </TouchableHighlight>
        );
    }
}

export default RecipientElement;
