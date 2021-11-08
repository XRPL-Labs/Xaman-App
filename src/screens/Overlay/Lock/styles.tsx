/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
        marginBottom: AppSizes.bottomStableInset,
    },
    logo: {
        width: AppSizes.scale(120),
        height: AppSizes.scale(55),
        resizeMode: 'contain',
    },
    blurView: {
        zIndex: 99999,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
    },
});

export default styles;
