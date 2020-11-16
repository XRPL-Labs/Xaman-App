import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: AppColors.light,
    },
    fromContainer: {
        backgroundColor: AppColors.white,
        padding: AppSizes.padding,
        paddingBottom: 40,
        zIndex: 9999999,
    },
    toContainer: {
        paddingTop: 40,
        padding: AppSizes.padding,
    },
    bottomContainer: {
        paddingHorizontal: AppSizes.padding,
    },
    currencyLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
    },
    currencyImageContainer: {
        height: AppSizes.scale(38),
        width: AppSizes.scale(38),
        marginRight: 10,
        borderWidth: 1,
        borderRadius: 8,
        justifyContent: 'center',
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
    },
    xrpImageContainer: {
        padding: 10,
        backgroundColor: AppColors.white,
        borderColor: AppColors.grey,
    },
    iouImageContainer: {
        borderColor: AppColors.light,
    },
    currencyImage: {
        width: AppSizes.scale(37),
        height: AppSizes.scale(37),
        resizeMode: 'cover',
    },
    subLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
    },

    inputContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: AppColors.white,
        borderRadius: 10,
        borderColor: AppColors.lightBlue,
        borderWidth: 2,
        paddingHorizontal: 15,
        paddingVertical: 15,
    },
    fromAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h3.size,
        fontWeight: '600',
        color: AppColors.red,
        overflow: 'hidden',
        padding: 0,
        margin: 0,
    },
    toAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        fontSize: AppFonts.h3.size,
        color: AppColors.green,
        padding: 0,
        margin: 0,
    },
    switchButton: {
        position: 'absolute',
        bottom: -20,
        backgroundColor: AppColors.lightBlue,
        zIndex: 99999,
    },
    backgroundImageStyle: {
        height: AppSizes.scale(200),
        width: AppSizes.scale(200),
        resizeMode: 'contain',
        tintColor: AppColors.grey,
        opacity: 1,
        transform: [{ rotate: '90deg' }],
    },
    loaderStyle: {
        alignSelf: 'center',
        width: AppSizes.scale(130),
        resizeMode: 'contain',
    },
    allButton: {
        backgroundColor: AppColors.lightBlue,
    },
});

export default styles;
