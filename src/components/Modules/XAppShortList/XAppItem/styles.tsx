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
        color: '$light',
        backgroundColor: '$light',
    },
    appIcon: {
        width: '80%',
        aspectRatio: 1,
        borderRadius: 10,
        marginBottom: AppSizes.paddingExtraSml,
    },
    appIconPlaceholder: {
        backgroundColor: '$silver',
    },
});

export default styles;
