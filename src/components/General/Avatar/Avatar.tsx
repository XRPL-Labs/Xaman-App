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
}

/* Component ==================================================================== */
const Avatar: React.SFC<Props> = ({ source, size = 45 }) => (
    <View style={[styles.container, { height: AppSizes.scale(size), width: AppSizes.scale(size) }]}>
        <Image
            source={source}
            style={[styles.image, { height: AppSizes.scale(size * 0.6), width: AppSizes.scale(size * 0.6) }]}
        />
    </View>
);

/* Export Component ==================================================================== */
export default Avatar;
