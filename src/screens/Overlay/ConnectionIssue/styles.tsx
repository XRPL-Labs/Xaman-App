/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppStyles, AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        alignItems: 'center',
        backgroundColor: AppColors.white,
        borderRadius: AppSizes.screen.width * 0.07,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },

    iconError: {
        tintColor: AppColors.red,
    },
    iconWarning: {
        tintColor: AppColors.orange,
    },
    iconInfo: {
        tintColor: AppColors.lightBlue,
    },
    iconSuccess: {
        tintColor: AppColors.green,
    },
    title: {
        ...AppStyles.h5,
        textAlign: 'center',
    },
    subTitle: {
        ...AppStyles.p,
        color: AppColors.black,
        textAlign: 'center',
    },
    titleError: {
        color: AppColors.red,
    },
    titleWarning: {
        color: AppColors.orange,
    },
    titleInfo: {
        color: AppColors.lightBlue,
    },
    titleSuccess: {
        color: AppColors.green,
    },
});

export default styles;
