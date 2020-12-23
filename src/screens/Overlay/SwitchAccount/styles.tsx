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
        paddingLeft: 15,
        paddingTop: 6,
        paddingBottom: 6,
        marginTop: 10,
        borderRadius: AppSizes.scale(50) / 3,
    },
    accountRowSelected: {
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
        alignSelf: 'center',
    },
    accountLabel: {
        fontFamily: AppFonts.h5.family,
        fontSize: AppFonts.p.size,
        color: AppColors.black,
    },
    accountAddress: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: AppColors.black,
    },
    accessLevelBadge: {
        flexDirection: 'row',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 7,
        alignSelf: 'flex-start',
        backgroundColor: AppColors.grey,
    },
    accessLevelBadgeSelected: {
        backgroundColor: AppColors.black,
    },
    accessLevelLabel: {
        marginLeft: 5,
        fontSize: AppFonts.base.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.greyDark,
        includeFontPadding: false,
    },
    accessLevelLabelSelected: {
        color: AppColors.white,
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
});

export default styles;
