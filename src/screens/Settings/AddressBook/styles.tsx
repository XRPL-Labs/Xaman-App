import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    searchInput: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
    },
    searchContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: 15,
    },
    avatarImage: {
        width: AppSizes.screen.width * 0.07,
        height: AppSizes.screen.width * 0.07,
        tintColor: AppColors.greyDark,
        resizeMode: 'contain',
    },
    row: {
        width: AppSizes.screen.width,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: AppSizes.paddingSml + 3,
        paddingVertical: 10,
    },
    rowIcon: {
        width: AppSizes.screen.width * 0.08,
        height: AppSizes.screen.width * 0.08,
        resizeMode: 'contain',
        tintColor: AppColors.greyDark,
    },
    name: {
        fontSize: 16,
        fontWeight: '500',
        color: AppColors.black,
    },
    address: {
        fontSize: 11,
        color: AppColors.greyDark,
    },
    sectionHeader: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        marginHorizontal: 20,
        borderRadius: 5,
        backgroundColor: AppColors.light,
    },
    sectionHeaderText: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        paddingLeft: 8,
        color: AppColors.black,
    },
});

export default styles;
