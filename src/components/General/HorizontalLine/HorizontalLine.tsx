/**
 *  Line
 *
    <HorizontalLine />
 *
 */
import React from 'react';

import { View, ViewStyle } from 'react-native';

import StyleService from '@services/StyleService';
/* Types ==================================================================== */
interface Props {
    width?: number;
    height?: number;
    color?: string;
    style?: ViewStyle | ViewStyle[];
}

/* Component ==================================================================== */
const HorizontalLine: React.SFC<Props> = ({
    width = '100%',
    height = 2,
    color = StyleService.value('$lightGrey'),
    style,
}) => (
    <View
        style={[
            style,
            {
                borderBottomColor: color,
                borderBottomWidth: height,
                width,
            },
        ]}
    />
);

/* Export Component ==================================================================== */
export default HorizontalLine;
