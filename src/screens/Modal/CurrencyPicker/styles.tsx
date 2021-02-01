import { StyleSheet } from 'react-native';

import { AppSizes, AppFonts, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { position: 'relative', flex: 1, flexDirection: 'column' },
    rowContainer: {
        width: '100%',
        paddingVertical: AppSizes.paddingSml,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: AppColors.white,
        borderBottomWidth: 1,
        borderColor: AppColors.grey,
    },
    checkIcon: {
        tintColor: AppColors.blue,
    },
    descriptionText: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
        fontWeight: 'bold',
        color: AppColors.black,
    },
    sectionHeader: {
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 5,
        backgroundColor: AppColors.lightGrey,
    },
    sectionHeaderText: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyExtraBold,
        color: AppColors.blue,
    },
    searchContainer: {
        marginHorizontal: AppSizes.paddingSml,
        marginBottom: 15,
    },
});

export default styles;
