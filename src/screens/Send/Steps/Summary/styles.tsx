import StyleService from '@services/StyleService';

import { AppSizes, AppStyles, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: '$background',
    },
    rowItemGrey: {
        backgroundColor: '$background',
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        // paddingTop: AppSizes.padding,
        borderTopColor: '$lightGrey',
        borderTopWidth: 1,
    },
    rowItemMulti: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowTitle: {
        paddingLeft: 15,
    },
    rowTitlePadding: {
        paddingBottom: 15,
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
        color: '$textPrimary',
    },
    pickerItemSub: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: 16,
        color: '$grey',
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
        color: '$grey',
    },
    currencyImageContainer: {
        marginRight: 10,
    },
    xrpAvatarContainer: {
        backgroundColor: '$white',
        padding: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '$grey',
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
        color: '$textPrimary',
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        alignItems: 'flex-start',
        justifyContent: 'center',
        color: '$textPrimary',
    },
    currencyItemCounterPartyLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$textSecondary',
        paddingTop: 5,
    },

    amountInput: {
        padding: 0,
        margin: 0,
        paddingLeft: 15,
        fontSize: AppFonts.h3.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$blue',
    },
    inputStyle: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        textAlign: 'left',
    },
    editButton: {
        backgroundColor: '$tint',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
    },
    rateContainer: {
        paddingLeft: 15,
        paddingTop: 15,
    },

    rateText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
        color: '$grey',
    },
    feeText: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$textPrimary',
    },
    feeContainer: {
        paddingLeft: 15,
        paddingTop: 15,
    },
    feePickerContainer: {
        paddingLeft: 15,
        paddingTop: 15,
    },
});

export default styles;
