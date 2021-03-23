/**
 *  Line
 *
    <Avatar source={{uri: ""}} size={45} />
 *
 */
import React from 'react';

import { View } from 'react-native';

import StyleService from '@services/StyleService';
/* Types ==================================================================== */
interface Props {
    width?: number;
    height?: number;
    color?: string;
}

/* Component ==================================================================== */
const HorizontalLine: React.SFC<Props> = ({ width = '100%', height = 2, color = StyleService.value('$lightGrey') }) => (
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
