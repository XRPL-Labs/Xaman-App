import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingExtraSml,
    },
    appTitle: {
        lineHeight: AppFonts.subtext.size * 0.95,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size * 0.89,
        textAlign: 'center',
        color: '$textPrimary',
        height: AppFonts.subtext.size * 2,
    },
    appTitlePlaceholder: {
        color: StyleService.select({ dark: '$darkGrey', light: '$light' }),
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$light' }),
    },
    appIcon: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 10,
        marginBottom: AppSizes.paddingExtraSml,
        alignSelf: 'center',
    },
    appIconPlaceholder: {
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$silver' }),
    },
    appIconPlaceholderText: {
        opacity: 0.4,
        // lineHeight: AppFonts.subtext.size * 1.4,
        // lineHeight: AppFonts.subtext.size,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textSecondary',
        // height: AppFonts.subtext.size,
    },
});

export default styles;
