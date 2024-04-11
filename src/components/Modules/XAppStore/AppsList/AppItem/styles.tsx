import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: AppSizes.heightPercentageToDP(7.5),
    },
    appTitle: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
    },
    appDescription: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.family,
        color: '$textSecondary',
        paddingRight: AppSizes.paddingSml,
    },
    appTitlePlaceholder: {
        color: StyleService.select({ dark: '$darkGrey', light: '$lightGrey' }),
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$lightGrey' }),
    },
    appDescriptionPlaceholder: {
        color: StyleService.select({ dark: '$darkGrey', light: '$lightGrey' }),
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$lightGrey' }),
    },
    appIcon: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 10,
    },
    appIconPlaceholder: {
        backgroundColor: StyleService.select({ dark: '$darkGrey', light: '$silver' }),
    },
    titleContainer: {
        flex: 1,
        marginTop: 5,
        marginLeft: AppSizes.paddingExtraSml,
    },
    rightPanelContainer: {
        alignItems: 'flex-end',
    },
    categoryLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size * 0.9,
        color: '$textPrimary',
    },
});

export default styles;
