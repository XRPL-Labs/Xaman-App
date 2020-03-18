import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: AppSizes.paddingSml,
        paddingLeft: AppSizes.paddingSml,
    },
    familySeedInput: {
        height: AppSizes.screen.height * 0.1,
    },
});

export default styles;
