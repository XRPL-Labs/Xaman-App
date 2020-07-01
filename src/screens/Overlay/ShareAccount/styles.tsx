import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    visibleContent: {
        // height: Sizes.screen.heightHalf + 100,
        height: AppSizes.screen.height * 0.9,
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
    },
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
