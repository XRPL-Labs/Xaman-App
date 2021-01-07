import { StyleSheet } from 'react-native';

import { AppFonts, AppColors, AppSizes } from '@theme';

const Styles = StyleSheet.create({
    container: {
        height: AppSizes.scale(55),
        borderRadius: AppSizes.scale(55) * 0.3,
        alignSelf: 'stretch',
        borderWidth: 1,
        justifyContent: 'center',
        backgroundColor: AppColors.blue,
        borderColor: AppColors.blue,
    },
    label: {
        alignSelf: 'center',
        position: 'absolute',
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.h5.size * 0.9,
        color: AppColors.white,
    },
    thumpContainer: {
        alignItems: 'flex-end',
        alignSelf: 'flex-start',
        marginVertical: 1,
        marginHorizontal: 5,
    },
    iconContainer: {
        height: AppSizes.scale(45),
        borderRadius: AppSizes.scale(45) * 0.3,
        backgroundColor: AppColors.transparentBlue,
        width: AppSizes.scale(45),
        justifyContent: 'center',
        alignItems: 'center',
    },
    spinner: {
        flex: 1,
        alignSelf: 'center',
    },
});

export default Styles;
