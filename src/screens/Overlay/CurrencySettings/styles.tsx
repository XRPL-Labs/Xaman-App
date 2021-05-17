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
        borderWidth: 1,
        borderColor: '$light',
        borderRadius: 8,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    brandAvatar: {
        height: AppSizes.scale(35),
        width: AppSizes.scale(35),
        alignSelf: 'center',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
        color: '$textPrimary',
        // borderWidth: 1,
        // borderColor: 'red',
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
        width: '50%',
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 3,
    },
    sendButton: {
        marginRight: 1.5,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        backgroundColor: StyleService.isDarkMode() ? '$blue' : '$white',
    },
    sendButtonIcon: { marginRight: 5, tintColor: StyleService.isDarkMode() ? '$white' : '$blue' },
    sendButtonText: { color: StyleService.isDarkMode() ? '$white' : '$blue' },
    exchangeButton: {
        marginLeft: 1.5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: StyleService.isDarkMode() ? '$grey' : '$white',
    },
    exchangeButtonIcon: { marginLeft: 5, tintColor: StyleService.isDarkMode() ? '$white' : '$blue' },
    exchangeButtonText: { color: StyleService.isDarkMode() ? '$white' : '$black' },

    infoButton: {
        marginLeft: 1.5,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    infoButtonIcon: { marginLeft: 5 },
    infoButtonText: { color: '$black' },

    removeButtonIcon: { marginLeft: 5, tintColor: '$red' },
    removeButtonText: { color: '$red' },
    infoContainer: {
        backgroundColor: '$blue',
    },
    infoText: {
        color: '$white',
    },
});

export default styles;
