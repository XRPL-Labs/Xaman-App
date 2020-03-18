import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleSheet.create({
    listContainer: { padding: 5 },
    logRow: {
        paddingBottom: 2,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size * 0.7,
    },
    debug: {
        color: AppColors.black,
    },
    warn: {
        color: AppColors.orange,
    },
    error: {
        color: AppColors.red,
    },
});

export default styles;
