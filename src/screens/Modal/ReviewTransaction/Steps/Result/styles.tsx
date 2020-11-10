import { StyleSheet } from 'react-native';

import { AppSizes, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    successImage: {
        alignSelf: 'center',
        width: AppSizes.scale(250),
        height: AppSizes.scale(250),
        resizeMode: 'contain',
    },
    detailsCard: {
        width: AppSizes.screen.width * 0.85,
        backgroundColor: AppColors.white,
        borderRadius: AppSizes.screen.width * 0.06,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 15,
        shadowOpacity: 0.2,
        padding: 20,
    },
});

export default styles;
