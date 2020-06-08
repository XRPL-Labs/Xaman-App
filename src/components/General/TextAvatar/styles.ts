import { StyleSheet } from 'react-native';

import { AppFonts, AppColors, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    container: {
        width: AppSizes.heightPercentageToDP(5),
        height: AppSizes.heightPercentageToDP(5),
        borderRadius: AppSizes.heightPercentageToDP(5),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.green,
    },
    text: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.h5.size,
        textTransform: 'uppercase',
        color: AppColors.white,
    },
});
