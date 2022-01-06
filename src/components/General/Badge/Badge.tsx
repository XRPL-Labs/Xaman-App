/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';

import { Text, ViewStyle } from 'react-native';

import { TouchableDebounce } from '@components/General';

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
    | 'planned';

interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
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
        const { label, type, size } = this.props;

        const style = [styles.label, { fontSize: SIZES[size] }];

        if (label) {
            return <Text style={style}>{label}</Text>;
        }

        switch (type) {
            case 'xrplns':
                return <Text style={style}>XRPLNS</Text>;
            case 'bithomp':
                return <Text style={style}>Bithomp</Text>;
            case 'xrpscan':
                return <Text style={style}>XRPScan</Text>;
            case 'payid':
                return <Text style={style}>PayString</Text>;
            case 'fioprotocol':
                return <Text style={style}>FIO</Text>;
            case 'accounts':
                return <Text style={style}>Myself</Text>;
            case 'contacts':
                return <Text style={style}>Contact</Text>;
            case 'success':
                return <Text style={style}>{Localize.t('global.success')}</Text>;
            case 'planned':
                return <Text style={style}>{Localize.t('events.eventTypePlanned')}</Text>;
            default:
                return null;
        }
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
