import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
        paddingHorizontal: AppSizes.paddingSml,
        backgroundColor: '$background',
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 5,
        shadowOpacity: 1,
        zIndex: 1,
    },
    filterButtonsContainer: {
        paddingLeft: 10,
        flexDirection: 'row',
    },
    filterButton: {
        height: 35,
        borderRadius: AppSizes.scale(35) / 4,
        // backgroundColor: '$tint',
        paddingHorizontal: 8,
        marginHorizontal: 3,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    filterButtonIcon: {
        tintColor: '$grey',
    },
    filterButtonText: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h5.size,
        color: '$grey',
        paddingHorizontal: 3,
    },
    favoriteButtonActive: {
        backgroundColor: '$lightOrange',
    },
    favoriteIconActive: {
        tintColor: '$orange',
    },
    hideZeroButtonActive: {
        backgroundColor: '$lightRed',
    },
    hideZeroIconActive: {
        tintColor: '$red',
    },
    searchBarContainer: {
        flex: 1,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBarInput: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$grey',
        paddingLeft: 30,
        fontWeight: '400',
    },
    searchBarIcon: {
        left: 8,
    },
});
