/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppSizes, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: AppColors.white,
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 0.5,
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
});

export default styles;
