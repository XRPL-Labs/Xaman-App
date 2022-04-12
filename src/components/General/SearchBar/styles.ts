import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    searchContainer: {
        flexDirection: 'row',
        height: AppSizes.heightPercentageToDP(5.5),
        borderRadius: 15,
        backgroundColor: '$tint',
    },
    searchContainerBorder: {
        borderWidth: 1.5,
        borderColor: '$lightBlue',
    },
    searchIcon: {
        flexDirection: 'column',
        width: 50,
        alignSelf: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
        tintColor: '$textPrimary',
    },
    searchInput: {
        height: '100%',
        paddingLeft: 50,
        paddingRight: 50,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.p.size,
        fontWeight: '600',
        color: '$textPrimary',
        paddingVertical: 0,
    },
    searchInputFull: {
        paddingRight: 10,
    },
    searchClear: {
        height: '100%',
        flexDirection: 'row',
        width: 50,
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
        tintColor: '$textPrimary',
    },
});
