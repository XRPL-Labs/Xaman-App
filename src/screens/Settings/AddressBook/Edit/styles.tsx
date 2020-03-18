import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanIcon: {
        tintColor: AppColors.white,
    },
    textInput: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size,
    },
    scanButton: {
        position: 'absolute',
        right: 3,
        height: AppSizes.screen.height * 0.06,
        width: AppSizes.screen.height * 0.06,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: AppColors.black,
    },
});

export default styles;
