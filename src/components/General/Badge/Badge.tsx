/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';

import { Text, TextStyle, ViewStyle } from 'react-native';

import { TouchableDebounce } from '@components/General/TouchableDebounce';

import Localize from '@locale';

import { AppColors, AppFonts } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
type BadgeType =
    | 'bithomp'
    | 'xrplns'
    | 'xrpscan'
    | 'payid'
    | 'fioprotocol'
    | 'contacts'
    | 'accounts'
    | 'success'
    | 'open'
    | 'planned'
    | 'count';

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
    bithomp: AppColors.brandBithomp,
    xrplns: AppColors.brandXrplns,
    xrpscan: AppColors.brandXrpscan,
    payid: AppColors.brandPayid,
    fioprotocol: AppColors.brandFIO,
    accounts: AppColors.blue,
    contacts: AppColors.blue,
    success: AppColors.green,
    planned: AppColors.blue,
    open: AppColors.grey,
    count: AppColors.grey,
};

const SIZES = {
    small: AppFonts.small.size * 0.7,
    medium: AppFonts.small.size,
    large: AppFonts.base.size,
};

/* Component ==================================================================== */
export default class Badge extends PureComponent<Props> {
    static defaultProps = {
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
            case 'xrplns':
                content = 'XRPLNS';
                break;
            case 'bithomp':
                content = 'Bithomp';
                break;
            case 'xrpscan':
                content = 'XRPScan';
                break;
            case 'payid':
                content = 'PayString';
                break;
            case 'fioprotocol':
                content = 'FIO';
                break;
            case 'accounts':
                content = 'Myself';
                break;
            case 'contacts':
                content = Localize.t('global.contact');
                break;
            case 'success':
                content = Localize.t('global.success');
                break;
            case 'open':
                content = Localize.t('events.eventTypeOpen');
                break;
            case 'planned':
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
                activeOpacity={onPress ? 0.8 : 1}
                style={[styles.container, { backgroundColor: color || COLORS[type] }, containerStyle]}
                onPress={this.onPress}
                testID={testID}
            >
                {this.renderInnerContent()}
            </TouchableDebounce>
        );
    }
}
