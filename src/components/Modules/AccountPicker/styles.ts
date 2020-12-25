import { StyleSheet } from 'react-native';

import { AppColors, AppStyles, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    pickerContainer: {
        borderRadius: 15,
        padding: 5,
        backgroundColor: AppColors.light,
    },
    pickerDropDownItem: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: AppColors.transparent,
        // padding: 10,
        // paddingTop: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
        // borderTopWidth: 1,
        // borderTopColor: AppColors.grey,
    },
    pickerDropDownItemActive: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: AppColors.lightBlue,
        // padding: 10,
        // paddingHorizontal: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
    },
    collapseButton: {
        backgroundColor: AppColors.black,
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: AppColors.white,
    },
    accountItemTitle: {
        fontSize: AppStyles.baseText.fontSize,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    accountItemSub: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: 16,
        color: AppColors.greyDark,
    },
});
