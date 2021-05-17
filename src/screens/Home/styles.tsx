import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accountCard: {
        backgroundColor: '$tint',
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
    },
    balanceLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    cardSmallLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.8,
        color: '$grey',
        textAlign: 'center',
    },
    iconSettings: {
        tintColor: '$grey',
        marginTop: 8,
        marginRight: 6,
    },
    iconEye: {
        tintColor: '$grey',
        marginTop: 12,
        marginRight: 3,
    },
    iconShare: {
        tintColor: '$grey',
        marginTop: 12,
        marginRight: 3,
    },
    cardAddress: {
        backgroundColor: '$white',
        color: '$blue',
        marginVertical: 15,
        borderRadius: 5,
        overflow: 'hidden',
        textAlign: 'left',
        justifyContent: 'center',
    },
    cardAddressText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
        color: '$grey',
    },
    shareIconContainer: {
        padding: 8,
        borderLeftWidth: 1,
        borderLeftColor: '$grey',
    },
    shareIcon: {
        tintColor: '$blue',
    },
    trustLineListContainer: {
        flex: 6,
        paddingHorizontal: 10,
    },
    balanceContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        paddingVertical: 10,
        marginTop: 10,
        backgroundColor: '$lightGrey',
        borderRadius: 8,
    },
    balanceText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        color: '$textPrimary',
        paddingRight: 8,
    },
    xrpAvatarContainer: {
        padding: 10,
        marginRight: 10,
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$grey',
        borderRadius: 8,
        justifyContent: 'center',
    },
    trustLineInfoIcon: {
        tintColor: '$grey',
        marginRight: 5,
    },
    xrpAvatar: {
        resizeMode: 'contain',
    },
    logo: {
        width: AppSizes.scale(120),
        height: AppSizes.scale(30),
        resizeMode: 'contain',
    },
    buttonRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 3,
    },
    buttonRowHalf: {
        width: '50%',
    },
    // SEND BUTTON
    sendButton: {
        marginRight: 1.5,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: StyleService.isDarkMode() ? '$blue' : '$white',
    },
    sendButtonIcon: { marginRight: 5, tintColor: StyleService.isDarkMode() ? '$white' : '$blue' },
    sendButtonText: { color: StyleService.isDarkMode() ? '$white' : '$blue' },

    // REQUEST BUTTON
    requestButton: {
        marginLeft: 1.5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$white',
    },

    requestButtonIcon: { marginLeft: 5, tintColor: StyleService.isDarkMode() ? '$white' : '$green' },
    requestButtonText: { color: StyleService.isDarkMode() ? '$white' : '$green' },

    QRButtonText: { fontSize: AppFonts.base.size },

    accountRow: {
        paddingRight: 20,
        paddingLeft: 20,
        paddingTop: 6,
        paddingBottom: 6,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(60) / 4,
        borderWidth: 1,
        borderColor: '$lightBlue',
        backgroundColor: '$tint',
    },
    iconAccount: {
        marginRight: 15,
        tintColor: '$contrast',
    },
    switchAccountButton: {
        backgroundColor: '$tint',
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
        marginRight: -10,
    },
    rateLoader: {
        paddingVertical: 5,
    },
    xrpIcon: {
        paddingRight: 40,
        tintColor: '$textPrimary',
    },
});

export default styles;
