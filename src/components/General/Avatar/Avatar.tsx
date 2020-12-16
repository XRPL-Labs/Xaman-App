/**
 * Image Avatar
 *
    <Avatar source={{uri: ""}} size={45} />
 *
 */
import React from 'react';

import { Image, ImageSourcePropType } from 'react-native';

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
    <Image
        resizeMode="cover"
        borderRadius={10}
        source={source}
        style={[styles.image, { height: AppSizes.scale(size), width: AppSizes.scale(size) }, border && styles.border]}
    />
);

/* Export Component ==================================================================== */
export default Avatar;
