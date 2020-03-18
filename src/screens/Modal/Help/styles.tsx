import { StyleSheet } from 'react-native';

import { AppColors } from '@theme';
/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch' },
    backgroundImageStyle: {
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 0.5,
    },
});

export default styles;
