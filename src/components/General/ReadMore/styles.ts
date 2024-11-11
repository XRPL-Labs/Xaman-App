import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    fullTextWrapper: {
        opacity: 0,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    actionButton: {
        flexDirection: 'row',
        paddingTop: AppSizes.paddingExtraSml,
        alignSelf: 'center',
    },
    actionButtonText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size,
        marginRight: 5,
        color: '$grey',
    },
    transparent: {
        opacity: 0,
    },
});
