import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    searchContainer: {
        flexDirection: 'row',
        height: AppSizes.heightPercentageToDP(5.5),
        marginHorizontal: 10,
        borderRadius: 15,
        backgroundColor: '$tint',
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
        flex: 1,
        height: '100%',
        paddingLeft: 50,
        paddingRight: 50,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.p.size,
        fontWeight: '600',
        color: '$textPrimary',
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
