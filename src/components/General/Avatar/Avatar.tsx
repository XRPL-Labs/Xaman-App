/**
 * Image Avatar
 *
    <Avatar source={{uri: ""}} size={45} />
 *
 */
import React from 'react';

import { View, Image, ImageSourcePropType } from 'react-native';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    source: ImageSourcePropType;
    size?: number;
    border?: boolean;
}

/* Component ==================================================================== */
const Avatar: React.SFC<Props> = ({ source, size = 40, border = false }) => (
    <View
        style={[
            styles.container,
            border && styles.border,
            { height: AppSizes.scale(size), width: AppSizes.scale(size) },
        ]}
    >
        <Image
            resizeMode="cover"
            borderRadius={10}
            source={source}
            style={[styles.image, { height: AppSizes.scale(size), width: AppSizes.scale(size) }]}
        />
    </View>
);

/* Export Component ==================================================================== */
export default Avatar;
