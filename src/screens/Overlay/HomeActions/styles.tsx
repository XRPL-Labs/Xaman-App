import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    rowListContainer: {
        paddingTop: AppSizes.padding,
    },
    actionButtonContainer: {
        flexDirection: 'row',
        paddingTop: AppSizes.padding,
    },
    appIcon: {
        width: AppSizes.scale(60),
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(10),
    },
    appTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        color: '$textPrimary',
    },
    activityIndicator: {
        height: AppSizes.scale(240),
    },
    xAppsIcon: {
        resizeMode: 'contain',
        height: AppSizes.scale(20),
        width: AppSizes.scale(80),
    },
});

export default styles;
