import { StyleSheet } from 'react-native';

import { AppStyles, AppSizes, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    // searchContainer: {
    //     alignItems: 'center',
    //     borderColor: AppColors.red,
    //     paddingLeft: 15,
    // },
    // searchInput: {
    //     color: AppColors.blue,
    // },
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
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        marginBottom: 8,
        backgroundColor: AppColors.light,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: AppColors.light,
    },
    itemSelected: {
        borderColor: AppColors.blue,
        borderWidth: 2,
        backgroundColor: AppColors.lightBlue,
    },
    selectedText: {
        color: AppColors.blue,
    },
    avatarContainer: {
        height: AppSizes.scale(45),
        width: AppSizes.scale(45),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: AppColors.white,
    },
    avatarImage: {
        // width: AppSizes.screen.width * 0.07,
        // height: AppSizes.screen.width * 0.07,
        height: AppSizes.scale(25),
        width: AppSizes.scale(25),
        tintColor: AppColors.greyDark,
        resizeMode: 'contain',
    },

    title: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.black,
        fontSize: AppFonts.base.size,
    },
    subtitle: {
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
        fontSize: AppFonts.base.size * 0.8,
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
});

export default styles;
