import { StyleSheet } from 'react-native';

import { AppSizes, AppColors, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    searchContainer: {
        flexDirection: 'row',
        height: AppSizes.heightPercentageToDP(5.5),
        marginHorizontal: 10,
        borderRadius: 15,
        backgroundColor: AppColors.grey,
    },
    searchIcon: {
        flexDirection: 'column',
        width: 50,
        alignSelf: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 0,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        paddingLeft: 50,
        paddingRight: 50,
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.p.size,
        fontWeight: '600',
        color: AppColors.blue,
    },
    searchClear: {
        height: '100%',
        flexDirection: 'row',
        width: 50,
        justifyContent: 'center',
        position: 'absolute',
        right: 0,
    },
});
