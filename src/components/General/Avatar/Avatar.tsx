/**
 * Image Avatar
 *
    <Avatar source={''} size={45} />
 *
 */
import React from 'react';

import { View, Image, ImageSourcePropType } from 'react-native';

import { AppSizes, AppColors } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: ImageSourcePropType;
    size?: number;
    color?: string;
}

/* Component ==================================================================== */
const Avatar: React.SFC<Props> = ({ source, size = 45, color = AppColors.greyDark }) => (
    <View style={[styles.container, { height: AppSizes.scale(size), width: AppSizes.scale(size) }]}>
        <Image
            source={source}
            style={[
                styles.image,
                { height: AppSizes.scale(size * 0.55), width: AppSizes.scale(size * 0.55), tintColor: color },
            ]}
        />
    </View>
);

/* Export Component ==================================================================== */
export default Avatar;
