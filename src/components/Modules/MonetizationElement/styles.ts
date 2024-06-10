import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingSml,
        borderRadius: AppSizes.borderRadius,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        gap: AppSizes.padding,
    },
    containerRequired: {
        borderWidth: 1,
        borderColor: '$grey',
    },
    containerComingUp: {
        backgroundColor: '$orange',
    },
    messageText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
});
