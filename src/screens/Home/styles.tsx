import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    // contentCard: {
    //     marginHorizontal: 22,
    //     marginBottom: 30,
    //     backgroundColor: '$white',
    //     borderRadius: AppSizes.screen.width * 0.06,
    //     shadowColor: '$grey',
    //     shadowOffset: { width: 0, height: 3 },
    //     shadowRadius: 8,
    //     shadowOpacity: 0.1,
    //     elevation: 10,
    // },
    BackgroundShapes: {
        // tintColor: '$red',
    },
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
    trustLinesHeader: {
        marginLeft: -15,
        marginRight: -15,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingBottom: 5,
        backgroundColor: '$background',
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 5,
        shadowOpacity: 1,
        zIndex: 1,
    },
    noTrustlineMessage: {
        marginTop: 10,
    },
    currencyList: {
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
    currencyItem: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 5,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    issuerLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
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
    brandAvatarContainer: {
        marginRight: 10,
        borderWidth: 1,
        borderColor: '$light',
        borderRadius: 10,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandAvatar: {
        height: AppSizes.scale(35),
        width: AppSizes.scale(35),
        resizeMode: 'cover',
    },
    currencyAvatar: {
        width: AppSizes.screen.width * 0.035,
        height: AppSizes.screen.width * 0.035,
        resizeMode: 'contain',
        paddingRight: 30,
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
