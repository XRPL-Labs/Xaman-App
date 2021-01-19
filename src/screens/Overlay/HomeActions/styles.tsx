import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        // height: Sizes.screen.heightHalf + 100,
        backgroundColor: AppColors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: AppColors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        paddingHorizontal: 25,
        paddingVertical: 15,
    },
    actionButton: {
        height: AppSizes.scale(100),
        borderWidth: 1,
        borderRadius: AppSizes.scale(75) / 4,
        paddingHorizontal: 15,
        alignSelf: 'stretch',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: AppColors.transparent,
    },
    actionButtonBlack: {
        backgroundColor: AppColors.black,
    },
    actionButtonLight: {
        backgroundColor: AppColors.grey,
    },
    actionButtonText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
    },
    appIcon: {
        width: AppSizes.scale(60),
        height: AppSizes.scale(60),
    },
    appTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
    },
    activityIndicator: {
        height: AppSizes.scale(130),
    },
});

export default styles;
