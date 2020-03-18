import { StyleSheet } from 'react-native';

import { AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    profileImageContainer: {
        backgroundColor: AppColors.red,
        padding: 25,
        borderRadius: 200,
    },
    profileImage: {
        tintColor: AppColors.white,
    },
    iconCheck: {
        tintColor: AppColors.black,
        alignSelf: 'center',
    },
});

export default styles;
