import { StyleSheet } from 'react-native';

import { AppStyles, AppColors } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    inputText: {
        fontSize: AppStyles.p.fontSize,
        fontFamily: AppStyles.pbold.fontFamily,
        textAlign: 'center',
        color: AppColors.blue,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: AppColors.grey,
    },
});

export default styles;
