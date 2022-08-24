import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        width: '100%',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '$lightGrey',
        color: '$silver',
        borderWidth: 3,
        marginBottom: 15,
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
    },
    currencyBalance: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: 'textPrimary',
    },
    dot: {
        height: 26,
        width: 26,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$grey',
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotSelected: {
        borderColor: '$green',
    },
    filled: {
        height: 15,
        width: 15,
        borderRadius: 8,
        backgroundColor: '$green',
        color: '$green',
    },
    selected: {
        backgroundColor: '$tint',
        borderColor: '$green',
    },
});
