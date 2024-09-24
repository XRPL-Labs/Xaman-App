import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    fullTextWrapper: {
        opacity: 0,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    viewMoreText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        marginRight: 5,
        color: '$grey',
    },
    transparent: {
        opacity: 0,
    },
});
