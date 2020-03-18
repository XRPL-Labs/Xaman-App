/**
 * Footer
 *
    <Footer></Footer>
 *
 */
import React from 'react';

import { Image } from 'react-native';

import { AppSizes } from '@theme';
import { Images } from '@common/helpers';

/* Types ==================================================================== */
interface Props {
    name: Extract<keyof typeof Images, string>;
    size: number;
    style?: any;
}

/* Component ==================================================================== */
const Icon: React.SFC<Props> = ({ name, size = 25, style }) => (
    <Image
        resizeMode="contain"
        source={Images[name]}
        style={[{ width: AppSizes.moderateScale(size), height: AppSizes.moderateScale(size) }, style]}
    />
);

/* Export Component ==================================================================== */
export default Icon;
