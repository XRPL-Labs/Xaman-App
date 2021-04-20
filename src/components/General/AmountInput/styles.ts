import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    input: {
        fontSize: AppFonts.h3.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$blue',
        alignSelf: 'center',
        margin: 0,
        padding: 0,
    },
});
