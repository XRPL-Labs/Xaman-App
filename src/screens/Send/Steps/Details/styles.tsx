import { StyleSheet, Platform } from 'react-native';

import { AppStyles, AppSizes, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        paddingLeft: 15,
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
        paddingBottom: 10,
        borderTopColor: AppColors.grey,
        borderTopWidth: 1,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 15,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.blue,
        paddingVertical: 15,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 15,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.black,
        paddingVertical: 15,
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    accountPickerContainer: {
        // borderRadius: 15,
        // height: 70,
        // paddingHorizontal: 14,
        // paddingVertical: 20,
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
        justifyContent: 'center',
        alignSelf: 'center',
    },
    currencySymbolTextContainer: {
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
    },
    currencySymbolText: {
        fontFamily: AppFonts.base.familyMonoBold,
        color: AppColors.greyDark,
        fontSize: AppFonts.h5.size * 0.9,
    },
    rateContainer: {
        paddingLeft: 15,
        paddingTop: 15,
    },
    rateText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
        color: AppColors.greyBlack,
    },
});

export default styles;
