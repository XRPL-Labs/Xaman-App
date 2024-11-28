import StyleService from '@services/StyleService';

import { HexToRgbA } from '@common/utils/color';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: AppSizes.borderRadius,
    },
    containerBlocked: {
        width: '100%',
        height: '100%',
        backgroundColor: HexToRgbA(StyleService.value('$background'), 0.8),
        position: 'absolute',
        borderRadius: AppSizes.borderRadius,
        zIndex: 9999, // top of all
    },
    iconContainer: {
        borderColor: '$lightGrey',
        backgroundColor: '$tint',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 10,
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
    },
    icon: {
        alignItems: 'center',
        resizeMode: 'contain',
        tintColor: '$contrast',
    },
    xAppsIcon: {
        tintColor: '$grey',
        marginLeft: 8,
        resizeMode: 'contain',
        height: 15,
        width: 35,
    },
    label: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    description: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
        color: '$grey',
    },
    transactionLabel: {
        color: '$blue',
    },
    amount: {
        flexWrap: 'wrap',
        flexShrink: 1,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
    amountValueContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    currency: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.subtext.size * 0.9,
    },
    outgoingColor: {
        color: '$red',
    },
    orangeColor: {
        color: '$orange',
    },
    naturalColor: {
        color: '$grey',
    },
    requestTimeText: {
        fontFamily: AppFonts.small.family,
        fontSize: AppFonts.small.size,
        color: '$grey',
    },
});

export default styles;
