import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    visibleContent: {
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    iconAccount: {
        marginRight: 15,
        opacity: 0.4,
    },
    iconAccountActive: {
        marginRight: 15,
        opacity: 1,
    },
    accountRow: {
        paddingRight: 20,
        paddingLeft: 18,
        paddingTop: 6,
        paddingBottom: 6,
        marginTop: 10,
        // marginBottom: 5,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(50) / 3,
        // borderRadius: 20,
        // borderBottomWidth: 1,
        // borderBottomColor: AppColors.red,
    },
    accountRowSelected: {
        // borderWidth: 2,
        // borderColor: AppColors.green,
        borderBottomWidth: 0,
        borderRadius: 20,
        backgroundColor: AppColors.lightGreen,
    },
    selectedText: {
        marginRight: 10,
        color: AppColors.green,
    },

    iconKey: {
        tintColor: AppColors.blue,
        marginRight: 5,
        // borderWidth: 1,
        // borderColor: AppColors.red,
        alignSelf: 'center',
    },
    accountLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        color: AppColors.black,
    },
    accessLevelContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: 3,
    },
    accessLevelLabel: {
        marginLeft: 5,
        fontSize: AppFonts.base.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.greyDark,
        includeFontPadding: false,
    },
    radioCircle: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: 3,
        borderColor: AppColors.grey,
        borderRadius: AppSizes.scale(23) / 2,
    },
    radioCircleSelected: {
        width: AppSizes.scale(23),
        height: AppSizes.scale(23),
        borderWidth: AppSizes.scale(6),
        borderColor: AppColors.green,
        borderRadius: AppSizes.scale(23) / 2,
        backgroundColor: AppColors.white,
    },
    switchButton: {
        backgroundColor: AppColors.black,
    },
    switchButtonText: {
        fontSize: AppFonts.base.size * 0.8,
    },
    addAccountButton: {
        alignSelf: 'flex-end',
    },
});

export default styles;
