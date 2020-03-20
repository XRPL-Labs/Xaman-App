import { StyleSheet } from 'react-native';

import { AppSizes, AppStyles, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    rowItemGrey: {
        backgroundColor: AppColors.light,
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        borderTopColor: AppColors.grey,
        borderTopWidth: 1,
    },
    rowTitle: {
        paddingLeft: 10,
    },
    pickerItem: {
        // paddingLeft: 10,
        // paddingTop: 10,
        // paddingBottom: 10,
        // justifyContent: 'space-between',
        // marginBottom: 5,
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
    currencyAvatar: {
        width: AppSizes.screen.width * 0.035,
        height: AppSizes.screen.width * 0.035,
        resizeMode: 'contain',
        marginTop: 1,
        marginRight: 10,
    },
    currencyBalance: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
    },
    brandAvatarContainer: {
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.greyDark,
        borderRadius: 8,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandAvatar: {
        width: AppSizes.screen.width * 0.1,
        height: AppSizes.screen.width * 0.1,
        resizeMode: 'cover',
    },
    xrpAvatarContainer: {
        backgroundColor: AppColors.white,
        padding: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.greyDark,
        borderRadius: 8,
        justifyContent: 'center',

        overflow: 'hidden',
    },
    xrpAvatar: {
        width: AppSizes.screen.width * 0.05,
        height: AppSizes.screen.width * 0.05,
        resizeMode: 'contain',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    amountInput: {
        padding: 0,
        margin: 0,
        paddingLeft: 10,
        fontSize: AppFonts.h3.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.blue,
    },
    inputStyle: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        textAlign: 'center',
    },
    editButton: {
        backgroundColor: AppColors.grey,
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
    },
    gradientImage: {
        width: 7,
        position: 'absolute',
        left: 0,
        top: 0,
    },
});

export default styles;
