/* eslint-disable react-native/no-color-literals */

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: '$tint',
        borderRadius: 20,
    },
    headerContainer: {
        backgroundColor: '$background',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: AppSizes.paddingSml,
        borderColor: '$tint',
        borderWidth: 1,
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 3,
        shadowOpacity: 0.1,
    },
    contentContainer: {
        padding: AppSizes.paddingSml,
    },
    currencyItem: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 5,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    brandAvatarContainer: {
        marginRight: 10,
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
        color: '$textPrimary',
    },
    issuerLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
    },
    currencyAvatar: {
        width: AppSizes.screen.width * 0.035,
        height: AppSizes.screen.width * 0.035,
        resizeMode: 'contain',
        marginTop: 1,
        marginRight: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 15,
        marginBottom: 15,
    },

    // send Button
    sendButton: {
        marginRight: 5,
        backgroundColor: '$blue',
    },
    sendButtonIcon: { tintColor: '$white' },
    sendButtonText: { fontSize: AppFonts.subtext.size, color: '$white' },

    // exchange Button
    exchangeButton: {
        marginLeft: 5,
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$black',
    },
    exchangeButtonIcon: { tintColor: '$white' },
    exchangeButtonText: { fontSize: AppFonts.subtext.size, color: '$white' },

    // withdraw Button
    withdrawButton: { marginTop: 10, marginBottom: 5, backgroundColor: '$white' },
    withdrawButtonIcon: { tintColor: '$black' },
    withdrawButtonText: { fontSize: AppFonts.subtext.size, color: '$black' },

    // deposit Button
    depositButton: { marginTop: 10, backgroundColor: '$white' },
    depositButtonIcon: { tintColor: '$black' },
    depositButtonText: { fontSize: AppFonts.subtext.size, color: '$black' },

    // info Button
    infoButton: {
        marginLeft: 5,
    },
    infoButtonIcon: {},
    infoButtonText: {
        fontSize: AppFonts.subtext.size,
        color: '$black',
    },

    // remove Button
    removeButton: { backgroundColor: '$lightRed' },
    removeButtonIcon: { tintColor: '$red' },
    removeButtonText: { color: '$red' },

    infoContainer: {
        backgroundColor: '$blue',
    },
    infoText: {
        color: '$white',
    },
    removeButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 15,
    },
    favoriteContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    favoriteText: {
        fontFamily: AppFonts.pb.family,
        fontSize: AppFonts.subtext.size,
        color: '$silver',
        paddingLeft: 5,
    },
    favoriteTextActive: {
        fontFamily: AppFonts.pb.family,
        fontSize: AppFonts.subtext.size,
        color: '$orange',
        paddingLeft: 5,
    },
    favoriteIcon: {
        tintColor: '$silver',
    },
    favoriteIconActive: {
        tintColor: '$orange',
    },
});

export default styles;
