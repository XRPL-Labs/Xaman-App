import React, { PureComponent } from 'react';
import { View, Text, TouchableHighlight, TouchableOpacity, ActivityIndicator, Platform, ViewStyle } from 'react-native';

import { Avatar, Badge, Icon } from '@components/General';
import { Images } from '@common/helpers/images';

import Localize from '@locale';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export type RecipientType = {
    id?: string;
    address: string;
    tag?: number;
    name: string;
    source?: string;
};

interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
    recipient: RecipientType;
    isLoading?: boolean;
    selected?: boolean;
    showMoreButton?: boolean;
    showAvatar?: boolean;
    showTag?: boolean;
    onPress?: () => void;
    onMorePress?: () => void;
}

/* Component ==================================================================== */
class RecipientElement extends PureComponent<Props> {
    static defaultProps = {
        showMoreButton: false,
        showAvatar: true,
        showTag: true,
    };

    onPress = () => {
        const { onPress } = this.props;

        if (onPress && typeof onPress === 'function') {
            onPress();
        }
    };

    onMorePress = () => {
        const { onMorePress } = this.props;

        if (onMorePress && typeof onMorePress === 'function') {
            onMorePress();
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
        const {
            recipient,
            selected,
            showMoreButton,
            showAvatar,
            showTag,
            isLoading,
            containerStyle,
            onPress,
        } = this.props;

        const badge = this.getBadge();
        const avatar = this.getAvatar();

        return (
            <TouchableHighlight
                activeOpacity={onPress ? 0.7 : 1}
                onPress={this.onPress}
                underlayColor="#FFF"
                key={recipient.id}
            >
                <View style={[styles.itemRow, selected && styles.itemSelected, containerStyle]}>
                    {showAvatar && <Avatar source={avatar} />}

                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <View style={{ paddingLeft: 10 }}>
                        <View style={AppStyles.row}>
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={[styles.title, selected ? styles.selectedText : null]}
                            >
                                {isLoading ? (
                                    Platform.OS === 'ios' ? (
                                        <>
                                            <Text>Loading </Text>
                                            <ActivityIndicator color={AppColors.blue} />
                                        </>
                                    ) : (
                                        'Loading...'
                                    )
                                ) : (
                                    recipient.name || Localize.t('global.noNameFound')
                                )}
                            </Text>
                            {badge && badge}
                        </View>
                        <Text style={[styles.subtitle, selected ? styles.selectedText : null]}>
                            {recipient.address}
                        </Text>

                        {!!recipient.tag && showTag && (
                            <View style={styles.destinationTagContainer}>
                                <Text style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.destinationTag')}:{' '}
                                    <Text style={AppStyles.colorBlue}>{recipient.tag}</Text>
                                </Text>
                            </View>
                        )}
                    </View>

                    {showMoreButton && (
                        <TouchableOpacity
                            onPress={this.onMorePress}
                            activeOpacity={0.7}
                            style={[AppStyles.flex1, AppStyles.rightAligned, AppStyles.centerContent]}
                        >
                            <Icon name="IconMoreVertical" size={30} style={AppStyles.imgColorGreyDark} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableHighlight>
        );
    }
}

export default RecipientElement;
