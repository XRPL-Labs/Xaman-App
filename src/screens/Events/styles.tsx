import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.lightGrey,
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
    sectionListContainer: {
        flex: 1,
        paddingLeft: AppSizes.padding,
        paddingRight: AppSizes.padding,
        paddingBottom: AppSizes.paddingSml,
        backgroundColor: AppColors.white,
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
