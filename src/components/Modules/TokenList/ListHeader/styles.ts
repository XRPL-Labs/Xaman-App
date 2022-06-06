import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
        paddingHorizontal: AppSizes.paddingSml,
        backgroundColor: '$background',
    },
    explainContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 6,
    },
    explainText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
        color: '$grey',
        textAlign: 'center',
        paddingLeft: 3,
    },
    tokenText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
});
