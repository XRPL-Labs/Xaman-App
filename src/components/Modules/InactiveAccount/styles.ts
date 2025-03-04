import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    regularKeyContainer: {
        marginHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        borderRadius: AppSizes.borderRadius,
        gap: AppSizes.paddingSml,
        backgroundColor: '$lightGreen',
    },
    regularAccountItem: {
        marginBottom: AppSizes.paddingExtraSml,
        marginHorizontal: AppSizes.paddingExtraSml,
        paddingVertical: AppSizes.paddingExtraSml,
        paddingHorizontal: AppSizes.paddingExtraSml,
        borderRadius: AppSizes.scale(60) / 4,
        borderWidth: 1,
        borderColor: '$lightBlue',
        backgroundColor: '$tint',
    },
    regularItemLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
    },
    regularItemAddress: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        color: '$grey',
    },
    iconInfo: {
        tintColor: '$grey',
        marginRight: 5,
    },
    iconAccount: {
        marginRight: 15,
        tintColor: '$grey',
    },
    messageContainer: {
        alignItems: 'center',
        backgroundColor: '$lightBlue',
        margin: AppSizes.paddingSml,
        padding: AppSizes.paddingSml,
        borderRadius: AppSizes.borderRadius,
        gap: AppSizes.paddingExtraSml,
    },
});
