import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        overflow: 'hidden',
    },

    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    propertyText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        color: '$textSecondary',
    },
    symbolTextStyle: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: '$textPrimary',
    },
    textValue: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: '$textPrimary',
    },
    bracketsText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.small.size,
        color: '$textSecondary',
    },
    minusIconContainer: {
        marginRight: 3,
        borderRadius: AppSizes.borderRadius,
        borderWidth: 1,
        borderColor: StyleService.select({ light: '$silver', dark: '$light' }),
        tintColor: StyleService.select({ light: '$silver', dark: '$light' }),
    },
    plusIconContainer: {
        marginRight: 3,
        borderRadius: AppSizes.borderRadius,
        borderWidth: 1,
        borderColor: '$red',
        tintColor: '$red',
    },
    seperatorLine: {
        borderWidth: 1,
        borderStyle: 'dotted',
        borderColor: StyleService.select({ light: '$silver', dark: '$light' }),
        marginRight: 3,
        marginLeft: 4,
    },
});
