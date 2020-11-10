import { StyleSheet } from 'react-native';

import { AppColors } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        backgroundColor: AppColors.white,
    },
    image: {
        resizeMode: 'contain',
    },
    border: {
        borderColor: AppColors.grey,
        borderWidth: 1,
        borderRadius: 10,
    },
});
