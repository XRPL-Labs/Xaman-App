import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    currencyItem: {
        width: AppSizes.screen.uncorrectedWidth, // Fixes fold devices
        flexDirection: 'row',
        backgroundColor: '$background',
        paddingHorizontal: AppSizes.paddingList,
    },
    currencyLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
    },
    xAppTokenContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    externalAssetxApp: {
        tintColor: '$white',
        height: AppFonts.subtext.size,
    },
    xAppLabel: {
        fontSize: AppFonts.p.size * 1.0,
        fontFamily: AppFonts.p.familyBold,
        fontWeight: 700,
    },
    xAppBalanceContainerCurrency: {
        fontSize: AppFonts.small.size * 0.8,
        paddingTop: 2,
        paddingRight: 8,
        color: '$grey',
    },
    fiatValueAmount: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyMono,
        marginTop: 6,
        color: '$grey',
        // marginRight: 5,
    },
    fiatValueAmountCurrency: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.small.size * 0.7,
        marginTop: 7,
        marginRight: 2,
    },
    xAppBalanceContainer: {
        color: '$textPrimary',
        fontSize: AppFonts.p.size * 1.2,
        fontFamily: AppFonts.p.familyMonoBold,
        fontWeight: 800,
    },
    issuerLabel: {
        fontSize: AppFonts.subtext.size * 0.9,
        fontFamily: AppFonts.base.family,
        color: '$grey',
    },
    lpBadgeContainer: {
        height: AppFonts.subtext.size * 0.85,
    },
    lpBadge: {
        paddingTop: 2,
        paddingLeft: 4,
        paddingRight: 3,
        height: AppFonts.subtext.size * 0.95,
    },
    xAppBadge: {
        paddingTop: 0,
    },
    balanceContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    tokenAvatarContainer: {
        marginRight: 10,
    },
    tokenIconContainer: {
        marginRight: 5,
        borderRadius: 3,
        borderColor: '$background',
        borderWidth: 1,
        overflow: 'hidden',
    },
    reorderButtonContainer: {
        flexDirection: 'row',
    },
    reorderButton: {
        marginRight: 5,
        paddingHorizontal: 20,
    },
    iconFavoriteContainer: {
        padding: 3,
        borderRadius: 15,
        backgroundColor: '$orange',
    },
    iconFavorite: {
        tintColor: '$white',
    },
});
