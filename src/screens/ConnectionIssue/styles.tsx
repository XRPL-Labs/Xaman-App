import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    backgroundImageStyle: { opacity: 0.01, height: AppSizes.screen.height },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    header: { textAlign: 'center', color: AppColors.black },
});

export default styles;
