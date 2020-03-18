/* eslint-disable react-native/no-color-literals */

import { StyleSheet, Platform } from 'react-native';

import { AppSizes, AppColors } from '@theme';

import { getNavigationBarHeight } from '@common/helpers';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999999,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: AppSizes.screen.width,
        height: AppSizes.screen.height,
        padding: AppSizes.paddingSml,
        paddingBottom: AppSizes.paddingSml + getNavigationBarHeight(),
        backgroundColor: Platform.OS === 'android' ? AppColors.white : AppColors.transparent,
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
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
