/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';

import { Text, TextStyle, ViewStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import Localize from '@locale';

import { AppColors, AppFonts } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export enum BadgeType {
    Bithomp = 'bithomp',
    Xrplns = 'xrplns',
    Xrpscan = 'xrpscan',
    Payid = 'payid',
    Fioprotocol = 'fioprotocol',
    Contacts = 'contacts',
    Accounts = 'accounts',
    Success = 'success',
    Planned = 'planned',
    Open = 'open',
    Count = 'count',
}

interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
    labelStyle?: TextStyle | TextStyle[];
    testID?: string;
    label?: string;
    color?: string;
    type?: BadgeType;
    size?: 'small' | 'medium' | 'large';
    onPress?: () => void;
}

const COLORS = {
    [BadgeType.Bithomp]: AppColors.brandBithomp,
    [BadgeType.Xrplns]: AppColors.brandXrplns,
    [BadgeType.Xrpscan]: AppColors.brandXrpscan,
    [BadgeType.Payid]: AppColors.brandPayid,
    [BadgeType.Fioprotocol]: AppColors.brandFIO,
    [BadgeType.Accounts]: AppColors.blue,
    [BadgeType.Contacts]: AppColors.blue,
    [BadgeType.Success]: AppColors.green,
    [BadgeType.Planned]: AppColors.blue,
    [BadgeType.Open]: AppColors.grey,
    [BadgeType.Count]: AppColors.grey,
};

const SIZES = {
    small: AppFonts.small.size * 0.7,
    medium: AppFonts.small.size,
    large: AppFonts.base.size,
};

/* Component ==================================================================== */
export default class Badge extends PureComponent<Props> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof Badge.defaultProps>>;

    static defaultProps: Partial<Props> = {
        size: 'small',
    };

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    renderInnerContent = () => {
        const { label, labelStyle, type, size } = this.props;

        const style = [styles.label, { fontSize: SIZES[size] }, labelStyle];

        if (label) {
            return (
                <Text adjustsFontSizeToFit numberOfLines={1} style={style}>
                    {label}
                </Text>
            );
        }

        let content = '';

        switch (type) {
            case BadgeType.Xrplns:
                content = 'XRPLNS';
                break;
            case BadgeType.Bithomp:
                content = 'Bithomp';
                break;
            case BadgeType.Xrpscan:
                content = 'XRPScan';
                break;
            case BadgeType.Payid:
                content = 'PayString';
                break;
            case BadgeType.Fioprotocol:
                content = 'FIO';
                break;
            case BadgeType.Accounts:
                content = 'Myself';
                break;
            case BadgeType.Contacts:
                content = Localize.t('global.contact');
                break;
            case BadgeType.Success:
                content = Localize.t('global.success');
                break;
            case BadgeType.Open:
                content = Localize.t('events.eventTypeOpen');
                break;
            case BadgeType.Planned:
                content = Localize.t('events.eventTypePlanned');
                break;
            default:
                return null;
        }

        return (
            <Text adjustsFontSizeToFit numberOfLines={1} style={style}>
                {content}
            </Text>
        );
    };

    render() {
        const { testID, color, type, onPress, containerStyle } = this.props;

        return (
            <TouchableDebounce
                activeOpacity={typeof onPress === 'function' ? 0.8 : 1}
                style={[styles.container, { backgroundColor: color || COLORS[type] }, containerStyle]}
                onPress={this.onPress}
                testID={testID}
            >
                {this.renderInnerContent()}
            </TouchableDebounce>
        );
    }
}
