import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        height: AppSizes.heightPercentageToDP(7.5),
    },
    row: {
        paddingTop: 10,
    },
    iconContainer: {
        borderColor: AppColors.grey,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderRadius: 10,
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
    },
    icon: {
        alignItems: 'center',
        resizeMode: 'contain',
    },
    avatar: {
        alignSelf: 'center',
        borderRadius: 10,
        width: AppSizes.scale(40),
        height: AppSizes.scale(40),
    },
    label: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
    },
    description: {
        fontFamily: AppFonts.subtext.family,
        fontSize: AppFonts.subtext.size * 0.9,
        color: AppColors.greyDark,
    },
    amount: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
    },
    currency: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.subtext.size * 0.9,
    },
    outgoingColor: {
        color: AppColors.red,
        tintColor: AppColors.red,
    },
    incomingColor: {
        color: AppColors.green,
        tintColor: AppColors.green,
    },
    orangeColor: {
        color: AppColors.orange,
        tintColor: AppColors.orange,
    },
    naturalColor: {
        color: AppColors.greyDark,
        tintColor: AppColors.greyDark,
    },
});

export default styles;
