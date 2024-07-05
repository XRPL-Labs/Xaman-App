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
        gap: AppSizes.paddingSml,
    },
    containerRequired: {
        backgroundColor: '$lightGrey',
    },
    containerComingUp: {
        backgroundColor: '$lightOrange',
    },
    okButton: {
        backgroundColor: '$orange',
    },
    okButtonText: {
        color: '$black',
        fontFamily: AppFonts.base.familyExtraBold,
    },
    messageTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    messageText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    actionButtonContainer: {
        backgroundColor: '$contrast',
    },
    actionButtonLabel: {
        color: '$textContrast',
        fontSize: AppFonts.subtext.size,
    },
});
