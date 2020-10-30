import { StyleSheet } from 'react-native';

import { AppSizes, AppColors, AppFonts } from '@theme';

const styles = StyleSheet.create({
    container: {
        height: AppSizes.scale(45),
        flexDirection: 'row',
        justifyContent: 'space-between',
        overflow: 'hidden',
    },
    button: {
        flex: 1,
        marginVertical: 3,
    },
    selectedButton: {
        backgroundColor: AppColors.white,
        borderRadius: 12,
        shadowColor: AppColors.blue,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: AppColors.greyBlack,
    },
});

export default styles;
