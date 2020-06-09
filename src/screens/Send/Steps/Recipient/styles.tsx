import { StyleSheet } from 'react-native';

import { AppStyles, AppSizes, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    inputText: {
        fontSize: AppStyles.p.fontSize,
        fontFamily: AppStyles.monoBold.fontFamily,
        color: AppColors.blue,
        paddingLeft: 15,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: AppColors.grey,
    },
    sectionHeader: {
        backgroundColor: AppColors.white,
        paddingTop: 5,
        paddingBottom: 5,
        shadowColor: AppColors.white,
    },
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    clearSearchButton: {
        height: AppSizes.scale(25),
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
    },
    clearSearchButtonText: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.blue,
        paddingLeft: 1,
        paddingRight: 0,
    },
});

export default styles;
