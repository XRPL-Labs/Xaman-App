import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    currencyItem: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: '$lightBlue',
        borderRadius: 15,
        paddingHorizontal: 5,
        marginHorizontal: AppSizes.paddingSml,
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
    },
    balanceText: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$blue',
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
        tintColor: '$blue',
    },
    currencyAvatarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
    },
});
