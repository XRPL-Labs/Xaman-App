import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textStyle: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.small.size,
        color: '$textPrimary',
        textAlign: 'center',
        paddingHorizontal: 5,
    },
});
