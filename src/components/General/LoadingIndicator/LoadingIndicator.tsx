/**
 * LoadingIndicator
 *
    <LoadingIndicator />
 *
 */

import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';

import StyleService from '@services/StyleService';
/* Types ==================================================================== */
interface Props {
    color?: string;
    size?: number | 'small' | 'large';
    style?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
const LoadingIndicator: React.SFC<Props> = ({ size = 'small', style }) => (
    <ActivityIndicator size={size} animating color={StyleService.value('$contrast')} style={style} />
);

/* Export Component ==================================================================== */
export default LoadingIndicator;
