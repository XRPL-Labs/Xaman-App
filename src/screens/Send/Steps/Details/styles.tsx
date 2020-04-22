import { StyleSheet, Platform } from 'react-native';

import { AppStyles, AppSizes, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
        paddingBottom: 10,
        borderTopColor: AppColors.grey,
        borderTopWidth: 1,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        paddingTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 10,
        fontSize: AppFonts.h1.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.blue,
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    pickerItem: {
        // paddingLeft: 13,
        // paddingTop: 10,
        // paddingBottom: 10,
    },
    pickerItemTitle: {
        fontSize: AppStyles.baseText.fontSize,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    pickerItemSub: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: 16,
        color: AppColors.greyDark,
    },
    // Currency
    pickerItemCurrency: {
        // paddingLeft: 8,
        // paddingTop: 10,
        // paddingBottom: 10,
        // borderWidth: 1,
        // borderColor: AppColors.green,
    },
    currencyImageContainer: {
        backgroundColor: AppColors.white,
        // padding: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.light,
        borderRadius: 10,
        justifyContent: 'center',
    },
    currencyImageIcon: {
        width: AppSizes.screen.width * 0.1,
        height: AppSizes.screen.width * 0.1,
        resizeMode: 'contain',
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyBalance: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
    },
    editButton: {
        backgroundColor: AppColors.grey,
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
        marginTop: Platform.OS === 'ios' ? 20 : 10,
    },
    /*
    brandAvatarContainer: {
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.red,
        // borderRadius: 10,
        justifyContent: 'center',
        // overflow: 'hidden',
    },
    brandAvatar: {
        width: AppSizes.screen.width * 0.1,
        height: AppSizes.screen.width * 0.1,
        resizeMode: 'contain',
    },
    xrpAvatarContainer: {
        backgroundColor: AppColors.white,
        padding: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.red,
        borderRadius: 10,
        justifyContent: 'center',
        // overflow: 'hidden',
    },
    xrpAvatar: {
        width: AppSizes.screen.width * 0.05,
        height: AppSizes.screen.width * 0.05,
        resizeMode: 'contain',
    },
    */
});

export default styles;
