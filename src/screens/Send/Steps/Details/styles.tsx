import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$background',
    },
    rowTitle: {
        paddingLeft: 15,
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
        paddingBottom: 10,
        borderTopColor: '$lightGrey',
        borderTopWidth: 1,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$blue',
        paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$textPrimary',
        paddingVertical: 15,
    },
    // Currency
    pickerItemCurrency: {
        // paddingLeft: 8,
        // paddingTop: 10,
        // paddingBottom: 10,
        // borderWidth: 1,
        // borderColor: '$green,
    },
    currencyImageContainer: {
        backgroundColor: '$white',
        // padding: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '$light',
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
        color: '$textPrimary',
    },
    currencyItemLabelSelected: {
        color: '$blue',
    },
    currencyBalance: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
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
        color: '$grey',
        fontSize: AppFonts.h5.size * 0.9,
    },
    rateContainer: {
        paddingLeft: 15,
        paddingTop: 15,
    },
    rateText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
        color: '$greyBlack',
    },
});

export default styles;
