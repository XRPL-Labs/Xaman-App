import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        paddingRight: AppSizes.paddingExtraSml,
    },
    countBadgeContainer: {
        backgroundColor: StyleService.select({ light: '$white', dark: '$black' }),
        borderRadius: 20,
    },
    countBadgeLabel: {
        color: '$textSecondary',
        fontSize: AppFonts.scaleFontSize(10),
        padding: 2,
    },
});
