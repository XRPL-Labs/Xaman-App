import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        paddingHorizontal: 25,
        paddingVertical: 15,
    },
    actionButtonBlack: {
        backgroundColor: '$contrast',
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
        height: AppSizes.scale(130),
    },
    xAppsIcon: {
        resizeMode: 'contain',
        height: AppSizes.scale(20),
        width: AppSizes.scale(80),
    },
});

export default styles;
