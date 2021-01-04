import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

const styles = StyleSheet.create({
    container: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    box: {
        height: AppSizes.widthPercentageToDP(8),
        width: AppSizes.widthPercentageToDP(8),
        borderRadius: 10,
        backgroundColor: AppColors.grey,
        borderColor: AppColors.greyDark,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boxActive: {
        height: AppSizes.widthPercentageToDP(10),
        width: AppSizes.widthPercentageToDP(10),
        borderRadius: 8,
        borderWidth: 3,
        borderColor: AppColors.blue,
        backgroundColor: AppColors.lightBlue,
    },
    label: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.base.size,
        color: AppColors.greyDark,
        textAlign: 'center',
    },
    labelActive: {
        fontSize: AppFonts.h5.size,
        color: AppColors.blue,
    },
    line: {
        borderBottomColor: AppColors.grey,
        borderBottomWidth: 4,
        width: AppSizes.widthPercentageToDP(6),
    },
});

export default styles;
