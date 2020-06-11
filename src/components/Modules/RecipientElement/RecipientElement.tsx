import React, { PureComponent } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';

import { Avatar, Badge } from '@components/General';
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

    getBadge = () => {
        const { recipient } = this.props;

        const source = recipient.source.replace('internal:', '').replace('.com', '');

        // @ts-ignore
        return <Badge type={source} />;
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

        const badge = this.getBadge();
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
                            {badge && badge}
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
