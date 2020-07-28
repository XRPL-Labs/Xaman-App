import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    headerImage: {
        // width: Sizes.screen.width * 0.4,
        // height: Sizes.screen.width * 0.4,
        width: AppSizes.scale(100),
        height: AppSizes.scale(100),
        alignSelf: 'center',
    },
});

export default styles;
