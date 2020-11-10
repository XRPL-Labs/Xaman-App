import { StyleSheet } from 'react-native';

import { AppSizes, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: AppColors.light,
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 0.5,
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
});

export default styles;
