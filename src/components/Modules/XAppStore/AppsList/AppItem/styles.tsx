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
        lineHeight: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
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
    },
    appIconPlaceholder: {
        backgroundColor: '$silver',
    },
});

export default styles;
