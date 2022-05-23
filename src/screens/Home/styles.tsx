import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
import Sizes from '@theme/sizes';

/* Styles ==================================================================== */
const styles = StyleService.create({
    headerContainer: {
        backgroundColor: '$transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: Sizes.moderateScale(60),
        paddingRight: Sizes.padding,
        paddingLeft: Sizes.paddingSml,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonsContainer: {
        backgroundColor: '$tint',
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
    },
    accountLabelText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    accountAddressText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        color: '$textSecondary',
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
    cardAddress: {
        backgroundColor: '$white',
        color: '$blue',
        marginVertical: 15,
        borderRadius: 5,
        overflow: 'hidden',
        textAlign: 'left',
        justifyContent: 'center',
    },
    shareIconContainer: {
        padding: 8,
        borderLeftWidth: 1,
        borderLeftColor: '$grey',
    },
    shareIcon: {
        tintColor: '$blue',
    },
    tokenListContainer: {
        flex: 6,
        // backgroundColor: '$red',
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
        flexDirection: 'row',
        marginBottom: 20,
        marginTop: 15,
        marginHorizontal: AppSizes.paddingSml,
    },
    // SEND BUTTON
    sendButton: {
        backgroundColor: '$blue',
    },
    sendButtonIcon: { tintColor: '$white' },
    sendButtonText: { fontSize: AppFonts.base.size, color: '$white' },

    requestButtonContainer: {
        marginLeft: 15,
    },

    // REQUEST BUTTON
    requestButton: {
        backgroundColor: '$green',
    },

    requestButtonIcon: { tintColor: '$white' },
    requestButtonText: { fontSize: AppFonts.base.size, color: '$white' },

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
