/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppStyles, AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: AppColors.white,
        borderRadius: 8,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 1,
        shadowOpacity: 0.4,
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
        fontWeight: 'bold',
        fontSize: AppFonts.h5.size,
    },
    subTitle: {
        ...AppStyles.p,
        textAlign: 'center',
    },
    header: {
        padding: 10,

        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: AppColors.greyDark,
        alignItems: 'center',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    headerError: {
        backgroundColor: AppColors.lightRed,
        color: AppColors.red,
    },
    headerWarning: {
        backgroundColor: AppColors.lightOrange,
        color: AppColors.orange,
    },
    headerInfo: {
        backgroundColor: AppColors.lightBlue,
        color: AppColors.blue,
    },
    headerSuccess: {
        backgroundColor: AppColors.lightGreen,
        color: AppColors.green,
    },
    footer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: AppColors.greyDark,
    },
    button: {
        padding: 20,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        alignItems: 'center',
        backgroundColor: AppColors.white,
    },
    buttonText: {
        fontFamily: AppFonts.p.family,
        fontSize: AppFonts.p.size,
        fontWeight: 'bold',
        color: AppColors.black,
    },
    buttonTextLight: {
        opacity: 0.6,
    },
    buttonTextDismiss: {
        color: AppColors.red,
    },

    buttonSeparator: {
        borderRightWidth: 0.4,
        borderRightColor: AppColors.greyDark,
    },
});

export default styles;
