import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        height: AppSizes.moderateScale(400),
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    declineButton: {
        backgroundColor: AppColors.red,
    },
    closeButton: {
        backgroundColor: AppColors.greyDark,
    },
});

export default styles;
