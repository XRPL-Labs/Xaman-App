/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppStyles, AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
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
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size * 0.9,
        color: AppColors.orange,
    },
    subTitle: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        color: AppColors.black,
        textAlign: 'center',
    },
    destinationTagText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        color: AppColors.black,
        textAlign: 'center',
    },
});

export default styles;
