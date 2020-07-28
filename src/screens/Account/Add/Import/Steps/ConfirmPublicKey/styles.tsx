import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    labelWrapper: {
        backgroundColor: AppColors.lightBlue,
        justifyContent: 'center',
        paddingHorizontal: 5,
        height: AppSizes.heightPercentageToDP(9),
        borderRadius: AppSizes.heightPercentageToDP(2),
        marginBottom: 10,
    },
    addressHeader: {
        fontSize: AppFonts.base.size,
        color: AppColors.blue,
        textAlign: 'center',
        paddingBottom: 10,
    },
    addressField: {
        color: AppColors.blue,
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        textAlign: 'center',
    },

    accountRow: {
        paddingRight: 10,
        paddingLeft: 10,
        paddingTop: 6,
        paddingBottom: 6,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(60) / 4,

        borderWidth: 1,
        borderColor: AppColors.lightBlue,
        backgroundColor: AppColors.light,
    },

    iconContainer: {
        backgroundColor: AppColors.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        marginRight: 15,
        padding: 12,
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
});

export default styles;
