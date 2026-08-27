import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    contentBox: {
        marginBottom: AppSizes.paddingSml,
        paddingHorizontal: 5,
    },
    addressContainer: {
        backgroundColor: '$lightGrey',
        marginBottom: AppSizes.paddingSml,
    },
    label: {
        fontFamily: AppFonts.small.family,
        fontSize: AppFonts.small.size,
        fontWeight: 'bold',
        color: '$grey',
        paddingLeft: 5,
        marginBottom: 10,
    },
    amount: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        color: '$red',
    },
    sellingAmount: {
        borderColor: '$red',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingBottom: 20,
        textAlign: 'center',
        alignItems: 'center',
        backgroundColor: '$lightRed',
    },
    nftSellPrefixContainer: {
        marginTop: 10,
        paddingHorizontal: 20,
        paddingVertical: 5,
    },
    value: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    nfTokenContainer: {
        paddingHorizontal: 0,
    },
    uriTokenContainer: {
        paddingHorizontal: 0,
    },
});

export default styles;
