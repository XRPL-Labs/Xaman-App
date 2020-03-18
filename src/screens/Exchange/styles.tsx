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
        padding: AppSizes.padding,
    },
    currencyLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMono,
    },
    xrpAvatar: {
        width: AppSizes.scale(44),
        height: AppSizes.scale(44),
        resizeMode: 'cover',
    },
    brandAvatarContainer: {
        height: AppSizes.scale(45),
        width: AppSizes.scale(45),
        marginRight: 10,
        borderWidth: 1,
        borderColor: AppColors.light,
        borderRadius: 8,
        justifyContent: 'center',
        overflow: 'hidden',
        alignSelf: 'center',
        alignItems: 'center',
    },
    brandAvatar: {
        width: AppSizes.scale(44),
        height: AppSizes.scale(44),
        resizeMode: 'cover',
    },
    subLabel: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyMono,
        color: AppColors.greyDark,
    },
    xrpAvatarContainer: {
        height: AppSizes.scale(45),
        width: AppSizes.scale(45),
        padding: 10,
        marginRight: 10,
        backgroundColor: AppColors.white,
        borderWidth: 1,
        borderColor: AppColors.grey,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
    },
    currencyAvatar: {
        width: AppSizes.scale(44),
        height: AppSizes.scale(44),
        resizeMode: 'contain',
        marginTop: 1,
        marginRight: 10,
    },
    fromAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.h1.size,
        fontWeight: '600',
        color: AppColors.red,
        overflow: 'hidden',
    },
    toAmount: {
        textAlign: 'right',
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        fontSize: AppFonts.h1.size,
        color: AppColors.green,
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
});

export default styles;
