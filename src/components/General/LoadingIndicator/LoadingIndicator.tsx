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
    color?: 'dark' | 'light' | 'default';
    size?: number | 'small' | 'large';
    style?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
const LoadingIndicator: React.FC<Props> = ({ color = 'default', size = 'small', style }) => (
    <ActivityIndicator
        size={size}
        animating
        color={(() => {
            switch (color) {
                case 'light':
                    return StyleService.value('$white');
                case 'dark':
                    return StyleService.value('$black');
                default:
                    return StyleService.value('$contrast');
            }
        })()}
        style={style}
    />
);

/* Export Component ==================================================================== */
export default LoadingIndicator;
