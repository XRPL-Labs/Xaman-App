/* eslint-disable react-native/no-color-literals */

import { StyleSheet } from 'react-native';

import { AppStyles, AppColors, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    visibleContent: {
        width: AppSizes.screen.width * 0.9,
        backgroundColor: AppColors.white,
        borderRadius: 20,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.4,
        ...AppStyles.paddingSml,
    },
});

export default styles;
