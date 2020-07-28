import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        marginBottom: AppSizes.tabbarHeight,
    },
    filterIcon: {
        tintColor: AppColors.blue,
    },
    sectionHeader: {
        backgroundColor: AppColors.white,
        paddingBottom: 0,
        paddingTop: 10,
        shadowColor: AppColors.white,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
    },
    row: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    optionsButton: {
        backgroundColor: AppColors.blue,
        height: AppSizes.moderateScale(30),
        borderRadius: 20,
        paddingLeft: 10,
        paddingRight: 10,
        marginRight: 0,
        marginLeft: 2,
        marginTop: 5,
        marginBottom: 5,
    },
    optionsButtonText: {
        paddingRight: 2,
        color: AppColors.white,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size * 0.9,
    },
    sectionListContainer: {
        paddingLeft: AppSizes.padding,
        paddingRight: AppSizes.padding,
        paddingBottom: AppSizes.paddingSml,
    },
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
});

export default styles;
