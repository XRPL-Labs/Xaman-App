import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
    button: {
        backgroundColor: AppColors.greyBlack,
        height: AppSizes.scale(50),
        borderRadius: AppSizes.scale(50) / 2,
    },
});

export default styles;
