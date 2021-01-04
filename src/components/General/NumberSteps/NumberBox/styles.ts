import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

const styles = StyleSheet.create({
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
    boxPast: {
        backgroundColor: AppColors.blue,
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
    labelPast: {
        color: AppColors.white,
    },
});

export default styles;
