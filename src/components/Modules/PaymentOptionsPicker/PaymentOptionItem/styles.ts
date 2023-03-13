import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        borderColor: '$lightGrey',
        borderWidth: 3,
        marginBottom: 10,
        paddingVertical: 12,
        paddingLeft: 15,
        paddingRight: 12,
    },
    selected: {
        backgroundColor: '$tint',
        borderColor: '$green',
    },
    currencyImageContainer: {
        marginRight: 10,
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size * 0.9,
        fontFamily: AppFonts.base.familyMonoBold,
        alignItems: 'flex-start',
        justifyContent: 'center',
        color: '$textPrimary',
    },
    counterpartyLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        color: '$grey',
        paddingTop: 2,
    },
    currencyItemLabelPlaceholder: {
        color: StyleService.isDarkMode() ? '$grey' : '$silver',
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$silver',
    },
    currencyBalance: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
    },
    currencyBalancePlaceholder: {
        color: StyleService.isDarkMode() ? '$grey' : '$silver',
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$silver',
    },
});
