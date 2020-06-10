import React, { PureComponent } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';

import { Avatar } from '@components/General/Avatar';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export type RecipientType = {
    id: string;
    address: string;
    name: string;
    source?: string;
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

    getTag = () => {
        const { recipient } = this.props;

        switch (recipient.source) {
            case 'internal:xrplns':
                return (
                    <View style={[styles.tag, styles.xrplnsTag]}>
                        <Text style={styles.tagLabel}>XRPLNS</Text>
                    </View>
                );
            case 'internal:bithomp.com':
                return (
                    <View style={[styles.tag, styles.bithompTag]}>
                        <Text style={styles.tagLabel}>Bithomp</Text>
                    </View>
                );
            case 'internal:xrpscan.com':
                return (
                    <View style={[styles.tag, styles.xrpscanTag]}>
                        <Text style={styles.tagLabel}>XRPScan</Text>
                    </View>
                );
            case 'internal:payid':
                return (
                    <View style={[styles.tag, styles.payidTag]}>
                        <Text style={styles.tagLabel}>PayID</Text>
                    </View>
                );
            default:
                break;
        }

        return undefined;
    };

    getAvatar = () => {
        const { recipient } = this.props;

        switch (recipient.source) {
            case 'internal:contacts':
                return Images.IconProfile;
            case 'internal:accounts':
                return Images.IconAccount;
            default:
                return Images.IconGlobe;
        }
    };

    render() {
        const { recipient, selected } = this.props;

        const tag = this.getTag();
        const avatar = this.getAvatar();

        return (
            <TouchableHighlight onPress={this.onPress} underlayColor="#FFF" key={recipient.id}>
                <View style={[styles.itemRow, selected ? styles.itemSelected : null]}>
                    <Avatar source={avatar} />

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
