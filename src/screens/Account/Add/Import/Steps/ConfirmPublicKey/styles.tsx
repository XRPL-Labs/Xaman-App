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
        marginBottom: 40,
        // shadowColor: AppColors.medBlue,
        // shadowOffset: {
        //     width: 0,
        //     height: 8,
        // },
        // shadowOpacity: 0.44,
        // shadowRadius: 10.32,
        // elevation: 16,
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
    bigIcon: {
        width: 80,
        height: 80,
        // marginBottom: 30,
    },
});

export default styles;
