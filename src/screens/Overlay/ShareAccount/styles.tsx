import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    // container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    qrCodeContainer: {
        borderRadius: 14,
        borderWidth: 5,
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: AppColors.grey,
        padding: 10,
        margin: 10,
    },
    qrCode: {
        borderRadius: 5,
        borderWidth: 5,
        borderColor: AppColors.light,
    },
    addressText: {
        width: '80%',
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.8,
        backgroundColor: AppColors.light,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 5,
        overflow: 'hidden',
        textAlign: 'center',
        alignSelf: 'center',
    },
});

export default styles;
