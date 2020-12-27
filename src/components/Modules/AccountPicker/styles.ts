import { StyleSheet } from 'react-native';

import { AppColors, AppStyles, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    pickerContainer: {
        borderRadius: 15,
        backgroundColor: AppColors.light,
        height: 80,
        paddingHorizontal: 17,
        justifyContent: 'center',
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
