import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    switchNetworkButton: {
        backgroundColor: '$tint',
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
        marginRight: -10,
    },
    switchNetworkButtonTextStyle: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.subtext.size,
        marginRight: 5,
    },
    networkColorCircle: {
        height: AppSizes.scale(13),
        width: AppSizes.scale(13),
        borderRadius: AppSizes.scale(13) / 2,
    },
});
