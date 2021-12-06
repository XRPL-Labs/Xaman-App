import isEqual from 'lodash/isEqual';
import React, { Component } from 'react';
import { View, Text, ViewStyle } from 'react-native';

import { TouchableDebounce, Avatar, Badge, Icon, LoadingIndicator } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export type RecipientType = {
    id?: string;
    address: string;
    tag?: number;
    name: string;
    source?: string;
    kycApproved?: boolean;
};

interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
    recipient: RecipientType;
    isLoading?: boolean;
    selected?: boolean;
    showMoreButton?: boolean;
    showAvatar?: boolean;
    showTag?: boolean;
    showSource?: boolean;
    onPress?: () => void;
    onMorePress?: () => void;
}

/* Component ==================================================================== */
class RecipientElement extends Component<Props> {
    static defaultProps = {
        showMoreButton: false,
        showAvatar: true,
        showTag: true,
        showSource: false,
    };

    shouldComponentUpdate(nextProps: Props) {
        const { recipient, isLoading, selected } = this.props;

        return (
            !isEqual(nextProps.recipient, recipient) ||
            !isEqual(nextProps.isLoading, isLoading) ||
            !isEqual(nextProps.selected, selected)
        );
    }

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    onMorePress = () => {
        const { onMorePress } = this.props;

        if (typeof onMorePress === 'function') {
            onMorePress();
        }
    };

    renderSource = () => {
        const { recipient, showSource } = this.props;

        if (recipient.source && showSource) {
            // @ts-ignore
            return <Badge type={recipient.source} />;
        }

        return null;
    };

    renderAvatar = () => {
        const { recipient, showAvatar } = this.props;

        if (!showAvatar) return null;

        const address = recipient.address || 'rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

        let badge = undefined as any;
        if (recipient.kycApproved) {
            badge = 'IconCheckXumm';
        }

        return <Avatar source={{ uri: `https://xumm.app/avatar/${address}_180_50.png` }} badge={badge} border />;
    };

    renderName = () => {
        const { recipient, selected, isLoading } = this.props;

        if (isLoading) {
            return (
                <>
                    <Text style={styles.nameText}>{Localize.t('global.loading')}... </Text>
                    <LoadingIndicator />
                </>
            );
        }

        return (
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.nameText, selected ? styles.selectedText : null]}
            >
                {recipient.name || Localize.t('global.noNameFound')}
            </Text>
        );
    };

    renderAddress = () => {
        const { recipient, selected } = this.props;

        return (
            <Text style={[styles.addressText, selected ? styles.selectedText : null]}>
                {recipient.address || 'rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
            </Text>
        );
    };

    renderDestinationTag = () => {
        const { recipient, showTag } = this.props;

        if (!recipient.tag || !showTag) return null;

        return (
            <View style={styles.destinationTagContainer}>
                <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
                    {Localize.t('global.destinationTag')}: <Text style={AppStyles.colorBlue}>{recipient.tag}</Text>
                </Text>
            </View>
        );
    };

    renderActions = () => {
        const { showMoreButton } = this.props;

        if (!showMoreButton) return null;

        return (
            <TouchableDebounce
                onPress={this.onMorePress}
                activeOpacity={0.7}
                style={[AppStyles.flex1, AppStyles.rightAligned, AppStyles.centerContent]}
            >
                <Icon name="IconMoreVertical" size={30} style={AppStyles.imgColorGrey} />
            </TouchableDebounce>
        );
    };

    render() {
        const { recipient, selected, containerStyle, onPress } = this.props;

        return (
            <TouchableDebounce
                testID={`recipient-${recipient.address}`}
                activeOpacity={onPress ? 0.7 : 1}
                onPress={this.onPress}
                style={[styles.container, selected && styles.containerSelected, containerStyle]}
                key={recipient.id}
            >
                {this.renderAvatar()}
                <View style={styles.centerContent}>
                    <View style={AppStyles.row}>
                        {this.renderName()}
                        {this.renderSource()}
                    </View>
                    {this.renderAddress()}
                    {this.renderDestinationTag()}
                </View>
                {this.renderActions()}
            </TouchableDebounce>
        );
    }
}

export default RecipientElement;
