import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    currencyImageContainer: {
        marginRight: 10,
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        alignItems: 'flex-start',
        justifyContent: 'center',
        color: '$textPrimary',
    },
    currencyIssuerLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$textSecondary',
        paddingTop: 5,
    },
    currencyItemLabelSelected: {
        color: '$blue',
    },
    currencyBalance: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
    },
});
