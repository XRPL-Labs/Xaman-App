import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    cancelButton: {
        height: AppSizes.screen.heightHalf * 0.1,
        backgroundColor: '$grey',
    },
    headerLeftContainer: {
        flex: 1,
        flexDirection: 'row',
        paddingLeft: AppSizes.paddingExtraSml,
        paddingRight: AppSizes.paddingSml,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    titleText: {
        color: '$textPrimary',
        fontFamily: AppFonts.p.familyBold,
        fontSize: AppFonts.p.size,

        marginLeft: AppSizes.paddingExtraSml,
    },
    headerText: {
        color: '$textPrimary',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        textAlign: 'center',
    },
    contentTextHeader: {
        color: '$textSecondary',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
    },
    contentText: {
        color: '$textPrimary',
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
    },
    donationButton: {
        marginLeft: AppSizes.paddingExtraSml,
    },
    openShareButtonsContainer: {
        flexDirection: 'row',
        gap: AppSizes.paddingExtraSml,
    },
    footer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: AppSizes.paddingSml + AppSizes.bottomInset,
    },
});

export default styles;
