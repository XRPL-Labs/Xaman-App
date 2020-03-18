import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    privateKeyRowId: {
        backgroundColor: AppColors.white,
        // paddingTop: 4,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        paddingRight: 15,
        color: AppColors.greyDark,
    },
    privateKeyRowIdActive: {
        color: AppColors.orange,
    },
    rowStyle: {
        marginBottom: 6,
        width: '90%',
    },
    rowStyleInner: {
        borderRadius: 10,
        overflow: 'hidden',
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderColor: AppColors.grey,
    },
    rowStyleInnerActive: {
        borderRadius: 10,
        overflow: 'hidden',
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderColor: AppColors.lightOrange,
    },
    borderLeft: {
        borderLeftWidth: 1,
    },
    privateKeyNum: {
        backgroundColor: AppColors.grey,
        borderColor: AppColors.greyDark,
        padding: 2,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        justifyContent: 'center',
    },
    privateKeyNumText: {
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
    },

    // Active states
    privateKeyRowActive: {
        backgroundColor: AppColors.red,
    },
    privateKeyNumActive: {
        backgroundColor: AppColors.lightOrange,
        // borderWidth: 2,
        borderColor: AppColors.orange,
        // borderColor: AppColors.grey,
    },
    privateKeyNumTextActive: {
        color: AppColors.orange,
    },

    rowAlphabetContainer: {},
});

export default styles;
