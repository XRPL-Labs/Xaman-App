import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingExtraSml,
        // position: 'relative',
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
    appTitleContainer: {
        height: AppFonts.subtext.size * 2,
    },
    appTitlePlaceholderContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        height: AppFonts.subtext.size * 2,
    },
    appIcon: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 10,
        marginBottom: AppSizes.paddingExtraSml,
        alignSelf: 'center',
        // borderWidth: 3,
        // borderColor: 'red',
    },
    appIconPlaceholder: {
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$silver' }),
        // borderColor: 'green',
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
