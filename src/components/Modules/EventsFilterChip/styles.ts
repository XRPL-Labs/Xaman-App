import { StyleSheet } from 'react-native';

import { AppSizes, AppColors, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    rowContainer: {
        paddingTop: AppSizes.paddingSml,
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    filterButton: {
        backgroundColor: AppColors.blue,
        height: AppSizes.moderateScale(30),
        borderRadius: 20,
        paddingLeft: 10,
        paddingRight: 10,
        marginRight: 0,
        marginLeft: 2,
        marginTop: 5,
        marginBottom: 5,
    },
    filterButtonText: {
        paddingRight: 2,
        color: AppColors.white,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
    },
});
