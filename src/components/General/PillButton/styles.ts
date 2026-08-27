import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '$tint',
        alignSelf: 'flex-start',
        flexShrink: 0,
        paddingHorizontal: 5,
        paddingVertical: 4,
        backgroundColor: '$tint',
        borderRadius: 10,
    },
    item: {
        paddingHorizontal: 10,
        paddingVertical: AppSizes.scale(3),
        backgroundColor: '$tint',
        borderRadius: 6.5,
    },
    title: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: StyleService.select({ light: '$grey', dark: '$grey' }),
    },
    activeTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: StyleService.select({ light: '$black', dark: '$black' }),
    },
    activeItem: {
        // backgroundColor: StyleService.select({ light: '$blue', dark: '$white' }),
        backgroundColor: '$white',
        paddingHorizontal: 10,
        marginHorizontal: 0,
    },
    firstItem: {
        // marginLeft: 0,
    },
    lastItem: {
        // marginRight: 0,
    },
    firstItemActive: {
        marginLeft: 0,
        paddingHorizontal: 10,
    },
    lastItemActive: {
        marginRight: 0,
        paddingHorizontal: 10,
    },
});
