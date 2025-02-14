import { Platform } from 'react-native';

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: '$background',
        paddingHorizontal: 5,
    },
    rowTitle: {
        flexDirection: 'row',
        // paddingLeft: 10,
        paddingBottom: 15,
        left: 0,
        right: 0,
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
        paddingBottom: 10,
        // borderTopColor: '$lightGrey',
        // borderTopWidth: 1,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 0,
        backgroundColor: '$lightGrey',
        borderRadius: 10,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$blue',
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 8 : 5,
        paddingLeft: 10,
        marginLeft: 0,
        // backgroundColor: '$lightGrey',
        borderRadius: 10,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMono,
        // fontWeight: '600',
        color: '$textPrimary',
        paddingVertical: 15,
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
        fontFamily: AppFonts.base.familyMono,
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
