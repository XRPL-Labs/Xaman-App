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
        lineHeight: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
        textAlign: 'center',
        color: '$textPrimary',
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
        lineHeight: AppFonts.subtext.size * 1.4,
    },
});

export default styles;
