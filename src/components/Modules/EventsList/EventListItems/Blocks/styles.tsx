import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    avatarContainer: {
        borderColor: '$lightGrey',
        backgroundColor: '$tint',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 10,
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
    },
    amountValueContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-end',
    },

    labelText: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    amountText: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    currencyText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.subtext.size * 0.9,
    },
    actionText: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
        color: '$grey',
    },

    xAppsIcon: {
        tintColor: '$grey',
        marginLeft: 8,
        resizeMode: 'contain',
        height: 15,
        width: 35,
    },

    outgoingColor: {
        color: '$red',
    },
    pendingDecColor: {
        color: '$orange',
    },
    pendingIncColor: {
        color: '$grey',
    },
    notEffectedColor: {
        color: '$grey',
    },
});

export default styles;
