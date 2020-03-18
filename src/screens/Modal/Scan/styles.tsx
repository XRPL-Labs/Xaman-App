import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';
/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        backgroundColor: AppColors.transparent,
    },
    close: {
        marginBottom: 40,
    },
    tip: {
        borderRadius: 50,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: AppColors.transparentBlack,
        marginBottom: 20,
    },
    topLeft: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: AppColors.white,
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        top: 40,
        left: 20,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: AppColors.white,
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        top: 40,
        right: 20,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: AppColors.white,
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        bottom: 20,
        left: 20,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
        borderWidth: 2,
        borderColor: AppColors.white,
        position: 'absolute',
        opacity: 0.5,
        borderRadius: 3,
        bottom: 20,
        right: 20,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    rectangle: {
        height: AppSizes.scale(250),
        width: AppSizes.scale(300),
        borderWidth: 2,
        borderColor: AppColors.white,
        backgroundColor: AppColors.transparent,
    },
    rectangleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: AppColors.transparent,
    },
    scanIconTransparent: {
        tintColor: AppColors.greyDark,
        opacity: 0.1,
    },
});

export default styles;
