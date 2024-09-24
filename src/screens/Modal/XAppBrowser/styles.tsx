import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        backgroundColor: '$background',
        flex: 1,
    },
    contentContainer: {
        backgroundColor: '$background',
        flex: 1,
        overflow: 'hidden',
    },
    webView: {
        backgroundColor: '$background',
    },
    stateContainer: {
        backgroundColor: '$background',
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContainer: {
        marginHorizontal: AppSizes.paddingSml,
    },
    errorContainer: {
        flex: 1,
        paddingHorizontal: AppSizes.paddingSml,
    },
    networkSwitchSubtext: {
        fontFamily: AppFonts.subtext.family,
        fontSize: AppFonts.subtext.size,
        color: '$textSecondary',
        textAlign: 'center',
    },
    supportedNetworkName: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textSecondary',
        textAlign: 'center',
        paddingTop: AppSizes.paddingExtraSml,
    },
    arrowUpImage: {
        resizeMode: 'contain',
        alignSelf: 'flex-end',
        tintColor: '$silver',
        marginTop: AppSizes.paddingSml,
        marginRight: AppSizes.moderateScale(70),
        width: AppSizes.moderateScale(30),
        height: AppSizes.moderateScale(60),
    },
});

export default styles;
