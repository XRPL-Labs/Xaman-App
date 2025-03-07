import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        // backgroundColor: '$tint',
        // borderRadius: 12,
        // padding: AppSizes.paddingExtraSml,
        paddingHorizontal: AppSizes.paddingSml,
        marginBottom: 5,
    },
    containerNoPadding: { // xApp header
        paddingRight: 0,
        paddingLeft: 3,
    },
    accountLabelText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.p.size,
        lineHeight: AppFonts.p.size * 1.4,
        color: '$textPrimary',
    },
    accountAddressText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        lineHeight: AppFonts.small.size * 1.1,
        color: '$textSecondary',
    },
    iconChevron: {
        tintColor: '$contrast',
        marginTop: 8,
        marginRight: 3,
    },
});
