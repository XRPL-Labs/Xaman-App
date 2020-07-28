/* eslint-disable react/jsx-props-no-spreading */
import React, { PureComponent } from 'react';

import { TouchableOpacity, Text, ViewStyle } from 'react-native';

import { AppColors, AppFonts } from '@theme';
import styles from './styles';

type BadgeType = 'bithomp' | 'xrplns' | 'xrpscan' | 'payid' | 'success';

interface Props {
    containerStyle?: ViewStyle | ViewStyle[];
    testID?: string;
    type: BadgeType;
    size?: 'small' | 'medium' | 'large';
    onPress?: () => void;
}

const COLORS = {
    bithomp: AppColors.bithomp,
    xrplns: AppColors.xrplns,
    xrpscan: AppColors.xrpscan,
    payid: AppColors.payid,
    success: AppColors.green,
};

const SIZES = {
    small: AppFonts.small.size * 0.7,
    medium: AppFonts.small.size,
    large: AppFonts.base.size,
};

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
        const { type, size } = this.props;

        const style = [styles.label, { fontSize: SIZES[size] }];

        switch (type) {
            case 'xrplns':
                return <Text style={style}>XRPLNS</Text>;
            case 'bithomp':
                return <Text style={style}>Bithomp</Text>;
            case 'xrpscan':
                return <Text style={style}>XRPScan</Text>;
            case 'payid':
                return <Text style={style}>PayID</Text>;
            case 'success':
                return <Text style={style}>Success</Text>;
            default:
                return null;
        }
    };

    render() {
        const { testID, type, onPress, containerStyle } = this.props;

        return (
            <TouchableOpacity
                activeOpacity={onPress ? 0.8 : 1}
                style={[styles.container, { backgroundColor: COLORS[type] }, containerStyle]}
                onPress={this.onPress}
                testID={testID}
            >
                {this.renderInnerContent()}
            </TouchableOpacity>
        );
    }
}
