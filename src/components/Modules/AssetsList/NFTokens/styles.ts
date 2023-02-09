import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    searchBarContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: AppSizes.paddingSml,
        paddingVertical: 10,
    },
    searchBarInput: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.subtext.size,
        color: '$grey',
        paddingLeft: 30,
        fontWeight: '400',
    },
    searchBarIcon: {
        left: 8,
    },
    loadingContainer: {
        flex: 1,
        paddingVertical: AppSizes.padding,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
