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
        gap: AppSizes.paddingExtraSml,
    },
    containerRequired: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: AppSizes.borderRadius,
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingMid,
        backgroundColor: '$lightGreen',
        borderColor: '$darkGreen',
        borderWidth: StyleService.hairlineWidth,
        gap: AppSizes.paddingExtraSml,
    },
    infoIcon: {
        tintColor: StyleService.isDarkMode() ? '$darkGreen' : '$darkGreen',
    },
    containerComingUp: {
        backgroundColor: '$lightOrange',
    },
    learnMoreButton: {
        paddingHorizontal: AppSizes.paddingExtraSml,
        borderRadius: AppSizes.borderRadius,
    },
    learnMoreButtonText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size * 0.9,
    },
    okButton: {
        marginTop: AppSizes.paddingExtraSml,
        borderRadius: AppSizes.borderRadius,
        backgroundColor: '$orange',
    },
    okButtonText: {
        color: '$black',
        fontFamily: AppFonts.base.familyExtraBold,
    },
    messageTitle: {
        fontFamily: AppFonts.base.familyExtraBold,
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
    messageTextSmall: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size * 0.9,
        color: '$textPrimary',
        textAlign: 'left',
        paddingRight: AppSizes.paddingExtraSml,
    },
    actionButtonContainer: {
        backgroundColor: '$contrast',
    },
    actionButtonLabel: {
        color: '$textContrast',
        fontSize: AppFonts.subtext.size,
    },
});
