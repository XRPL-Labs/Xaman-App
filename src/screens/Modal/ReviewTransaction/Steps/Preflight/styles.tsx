import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$tint',
    },
    contentContainer: {
        flex: 1,
        padding: AppSizes.paddingSml,
        paddingBottom: AppSizes.padding * 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContainer: {
        backgroundColor: StyleService.select({ light: '$darkGrey', dark: '$black' }),
        borderColor: '$background',
        borderWidth: StyleService.hairlineWidth,
    },
    actionDescription: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$white',
    },
    infoIcon: {
        tintColor: '$red',
    },
    errorContainer: {
        flex: 1,
        paddingHorizontal: AppSizes.paddingSml,
    },
    arrowUpImage: {
        resizeMode: 'contain',
        alignSelf: 'flex-start',
        tintColor: '$silver',
        marginTop: AppSizes.paddingSml,
        marginLeft: AppSizes.moderateScale(30),
        width: AppSizes.moderateScale(25),
        height: AppSizes.moderateScale(55),
        transform: [{ rotateY: '180deg' }],
    },
    networkSwitchSubtext: {
        fontFamily: AppFonts.subtext.family,
        fontSize: AppFonts.subtext.size,
        color: '$textSecondary',
        textAlign: 'center',
    },
});

export default styles;
