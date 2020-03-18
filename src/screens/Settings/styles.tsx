import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    rowContainer: {
        paddingTop: AppSizes.heightPercentageToDP(2.5),
        paddingBottom: AppSizes.heightPercentageToDP(2.5),
    },
    rowLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
    },
    hr: {
        borderBottomColor: AppColors.grey,
        borderBottomWidth: 2,
        marginTop: 7,
        marginBottom: 7,
    },
});

export default styles;
