import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {},
    closeButton: {
        paddingTop: AppSizes.paddingMid,
        paddingRight: AppSizes.paddingMid,
    },
    closeButtonIcon: {
        tintColor: '$contrast',
    },
    titleText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        paddingTop: AppSizes.paddingMid,
        paddingHorizontal: AppSizes.paddingMid,
    },
    contentContainer: {
        paddingTop: AppSizes.paddingExtraSml,
        paddingBottom: AppSizes.paddingMid,
        paddingHorizontal: AppSizes.paddingMid,
    },
});
