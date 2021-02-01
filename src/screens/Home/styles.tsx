import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        marginBottom: AppSizes.tabbarHeight,
    },
    contentCard: {
        marginHorizontal: 22,
        marginBottom: 30,
        backgroundColor: AppColors.white,
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    accountCard: {
        backgroundColor: AppColors.light,
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
    },
    balanceLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: AppColors.black,
    },
    cardSmallLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.8,
        color: AppColors.greyBlack,
        textAlign: 'center',
    },
    iconSettings: {
        tintColor: AppColors.greyDark,
        marginTop: 8,
        marginRight: 6,
    },
    iconEye: {
        tintColor: AppColors.greyDark,
        marginTop: 12,
        marginRight: 3,
    },
    iconShare: {
        tintColor: AppColors.greyDark,
        marginTop: 12,
        marginRight: 3,
    },
    cardAddress: {
        backgroundColor: AppColors.white,
        color: AppColors.blue,
        marginVertical: 15,
        borderRadius: 5,
        overflow: 'hidden',
        textAlign: 'left',
        justifyContent: 'center',
    },
    cardAddressText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.9,
        color: AppColors.greyBlack,
    },
    shareIconContainer: {
        padding: 8,
        borderLeftWidth: 1,
        borderLeftColor: AppColors.grey,
    },
    shareIcon: {
        tintColor: AppColors.blue,
    },
    trustLinesHeader: {
        marginLeft: -15,
        marginRight: -15,
        marginBottom: 5,
        paddingHorizontal: 15,
        paddingBottom: 5,
        backgroundColor: AppColors.white,
        shadowColor: AppColors.white,
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
        backgroundColor: AppColors.grey,
        borderRadius: 8,
    },
    balanceText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h4.size,
        color: AppColors.black,
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
        // fontWeight: 'bold',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    issuerLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
    },
    xrpAvatarContainer: {
        padding: 10,
        marginRight: 10,
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.grey,
        borderRadius: 8,
        justifyContent: 'center',
    },
    trustLineInfoIcon: {
        tintColor: AppColors.greyDark,
        marginRight: 5,
    },
    xrpAvatar: {
        resizeMode: 'contain',
    },
    brandAvatarContainer: {
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.light,
        borderRadius: 8,
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
        marginTop: 1,
        marginRight: 10,
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
    },
    sendButtonIcon: { marginRight: 5, tintColor: AppColors.blue },
    sendButtonText: { color: AppColors.blue },

    // REQUEST BUTTON
    requestButton: {
        marginLeft: 1.5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },

    requestButtonIcon: { marginLeft: 5, tintColor: AppColors.green },
    requestButtonText: { color: AppColors.green },

    QRButtonText: { fontSize: AppFonts.base.size },

    accountRow: {
        paddingRight: 20,
        paddingLeft: 20,
        paddingTop: 6,
        paddingBottom: 6,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(60) / 4,

        borderWidth: 1,
        borderColor: AppColors.lightBlue,
        backgroundColor: AppColors.light,
    },
    iconAccount: {
        marginRight: 15,
    },
    switchAccountButton: {
        backgroundColor: AppColors.white,
        borderColor: AppColors.light,
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
    },
    switchAccountButtonText: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.blue,
        paddingLeft: 1,
        paddingRight: 0,
    },
    rateLoader: {
        paddingVertical: 4,
    },
    xrpIcon: {
        paddingRight: 40,
    },
});

export default styles;
