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
        padding: 15,
    },
    nextButton: {
        backgroundColor: AppColors.green,
    },
    textInput: {
        textAlign: 'center',
    },
    avatarContainer: {
        height: AppSizes.scale(45),
        width: AppSizes.scale(45),
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        height: AppSizes.scale(30),
        width: AppSizes.scale(30),
        tintColor: AppColors.greyDark,
        resizeMode: 'contain',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: AppColors.grey,
    },
    title: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.green,
        fontSize: AppFonts.base.size,
    },
    subtitle: {
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.green,
        fontSize: AppFonts.base.size * 0.8,
    },
});

export default styles;
