import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
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
});

export default styles;
