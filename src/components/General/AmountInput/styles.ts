import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
export default StyleSheet.create({
    input: {
        fontSize: AppFonts.h3.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.blue,
        alignSelf: 'center',
        margin: 0,
        padding: 0,
    },
});
