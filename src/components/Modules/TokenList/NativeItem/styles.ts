import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    currencyItem: {
        justifyContent: 'space-between',
        backgroundColor: '$lightBlue',
        borderRadius: 15,
        paddingHorizontal: 5,
        paddingVertical: 5,
        marginHorizontal: AppSizes.paddingSml,
    },
    balanceRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    reserveRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 5,
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.isDarkMode() ? '$white' : '$blue',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
    },
    balanceText: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.isDarkMode() ? '$white' : '$blue',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 5,
    },
    brandAvatarContainer: {
        marginRight: 10,
    },
    brandAvatar: {
        backgroundColor: '$blue',
        borderColor: '$blue',
    },
    currencyAvatar: {
        tintColor: StyleService.isDarkMode() ? '$white' : '$blue',
    },
    currencyAvatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
    },
    reserveTextContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 10,
    },
    reserveTextLabel: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$grey',
    },
    reserveInfoIconContainer: {
        paddingLeft: AppSizes.scale(11),
        paddingRight: AppSizes.scale(10),
    },
    fiatAmountText: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: StyleService.isDarkMode() ? '$white' : '$blue',
        marginRight: 5,
    },
});
