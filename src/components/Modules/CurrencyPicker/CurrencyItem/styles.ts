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
    currencyItemCounterPartyLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$textSecondary',
    },
    currencyItemLabelSelected: {
        color: '$blue',
    },
    currencyBalance: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
    },
});
