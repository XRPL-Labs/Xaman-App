import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    headerContainer: {
        backgroundColor: '$transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: AppSizes.moderateScale(60),
        paddingRight: AppSizes.paddingSml,
        paddingLeft: AppSizes.paddingSml,
    },
    monetizationContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: AppSizes.paddingSml,
    },
    tokenListContainer: {
        flex: 6,
    },
    logo: {
        width: AppSizes.scale(120),
        height: AppSizes.scale(30),
        resizeMode: 'contain',
    },
    buttonRow: {
        flexDirection: 'row',
        marginBottom: 20,
        marginTop: 15,
        marginHorizontal: AppSizes.paddingSml,
    },
    // SEND BUTTON
    sendButtonContainer: {
        backgroundColor: '$blue',
    },
    sendButtonIcon: { tintColor: '$white' },
    sendButtonText: { fontSize: AppFonts.base.size, color: '$white' },

    // REQUEST BUTTON
    requestButtonContainer: {
        marginLeft: 15,
        backgroundColor: '$green',
    },

    requestButtonIcon: { tintColor: '$white' },
    requestButtonText: { fontSize: AppFonts.base.size, color: '$white' },

    QRButtonText: { fontSize: AppFonts.base.size },

    networkDetailsContainer: {
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        backgroundColor: '$contrast',
        borderRadius: 12,
        paddingHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: 5,
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: AppSizes.paddingExtraSml,
    },
    networkTextLabel: {
        color: '$silver',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.small.size,
    },
    networkTextContent: {
        color: '$textContrast',
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.subtext.size * 0.8,
    },
    accountSwitchElement: {
        marginHorizontal: AppSizes.paddingSml,
    },
});

export default styles;
