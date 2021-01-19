/**
 *  Line
 *
    <Avatar source={{uri: ""}} size={45} />
 *
 */
import React from 'react';

import { View } from 'react-native';

import { AppColors } from '@theme';

/* Types ==================================================================== */
interface Props {
    width?: number;
    height?: number;
    color?: string;
}

/* Component ==================================================================== */
const HorizontalLine: React.SFC<Props> = ({ width = '100%', height = 2, color = AppColors.grey }) => (
    <View
        style={{
            borderBottomColor: color,
            borderBottomWidth: height,
            width,
        }}
    />
);

/* Export Component ==================================================================== */
export default HorizontalLine;
