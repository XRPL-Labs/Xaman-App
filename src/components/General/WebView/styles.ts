import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

export default StyleService.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    // eslint-disable-next-line react-native/no-color-literals
    webView: {
        backgroundColor: '#ffffff',
    },
    loadingStyle: {
        zIndex: 999999,
        backgroundColor: '$background',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: AppSizes.paddingExtraSml,
    },
    errorTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
        textAlign: 'center',
    },
    errorText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size,
        color: '$silver',
        textAlign: 'center',
    },
});
