import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
        // backgroundColor: '$background',
        // shadowColor: '$background',
        // shadowOffset: { width: 0, height: 10 },
        // shadowRadius: 5,
        // shadowOpacity: 1,
        // zIndex: 1,
    },
    filterButtonsContainer: {
        paddingLeft: 10,
        flexDirection: 'row',
    },
    notVisible: {
        display: 'none',
    },
    filterBtn: {
        marginBottom: AppSizes.scale(9),
        height: AppSizes.scale(40),
        borderRadius: 15,
    },
    buttonContainer: {
        bottom: 0,
        left: 0,
        right: 0,
        top: -3,
        paddingHorizontal: AppSizes.paddingExtraSml,
        justifyContent: 'center',
        alignSelf: 'stretch',
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
        paddingVertical: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    searchBarInput: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$contrast',
        paddingLeft: 50,
        fontWeight: '600',
    },
    searchBarIcon: {
        left: 15,
        color: '$contrast',
        tintColor: '$contrast',
    },
});
