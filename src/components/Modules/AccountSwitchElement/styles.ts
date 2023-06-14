import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '$tint',
        borderRadius: 12,
        padding: AppSizes.paddingExtraSml,
        paddingHorizontal: AppSizes.paddingSml,
        marginHorizontal: AppSizes.paddingSml,
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
    iconChevron: {
        tintColor: '$contrast',
        marginTop: 8,
        marginRight: 3,
    },
});
