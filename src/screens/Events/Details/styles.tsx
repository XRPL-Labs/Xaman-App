import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    qrCodeContainer: {
        width: AppSizes.screen.width,
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.light,
        padding: 25,
    },
    qrImage: {
        backgroundColor: AppColors.white,
        padding: 10,
        borderRadius: 4,
        marginBottom: 10,
    },
    detailsContainer: {
        width: AppSizes.screen.width,
        padding: 25,
    },
    statusText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        textAlign: 'center',
        marginBottom: 20,
    },
    statusSuccess: {
        color: AppColors.green,
    },
    statusFailed: {
        color: AppColors.red,
    },
    hashText: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.base.size * 0.8,
        color: AppColors.greyDark,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    labelText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size,
        marginBottom: 8,
    },
    contentText: {
        fontFamily: AppFonts.base.familyMono,
        lineHeight: 20,
        fontSize: AppFonts.base.size * 0.9,
        color: AppColors.black,
    },
    dangerHeader: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        padding: AppSizes.paddingSml,
        backgroundColor: AppColors.red,
    },
});

export default styles;
