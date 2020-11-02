import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
export default StyleSheet.create({
    messageBox: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    messageBoxFlat: {
        borderRadius: 0,
    },
    iconContainer: {
        paddingRight: 10,
        alignItems: 'center',
    },

    labelContainer: {
        flex: 1,
        paddingVertical: 10,
    },
    label: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        textAlign: 'center',
    },
    info: {
        backgroundColor: AppColors.lightBlue,
        borderColor: AppColors.blue,
        tintColor: AppColors.blue,
    },
    infoIcon: { tintColor: AppColors.blue },
    warning: {
        backgroundColor: AppColors.lightOrange,
        borderColor: AppColors.orange,
        tintColor: AppColors.orange,
    },
    warningIcon: { tintColor: AppColors.orange },
    error: {
        backgroundColor: AppColors.lightRed,
        borderColor: AppColors.lightRed,
        tintColor: AppColors.red,
    },
    errorIcon: { tintColor: AppColors.red },
    success: {
        backgroundColor: AppColors.lightGreen,
        borderColor: AppColors.lightGreen,
        tintColor: AppColors.green,
    },
    successIcon: { tintColor: AppColors.green },
    neutral: {
        backgroundColor: AppColors.lightGrey,
        borderColor: AppColors.lightGrey,
        tintColor: AppColors.grey,
    },
    neutralIcon: { tintColor: AppColors.grey },
});
