import { StyleSheet } from 'react-native';

import { AppColors, AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    container: {
        backgroundColor: AppColors.grey,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 10,
        borderColor: AppColors.grey,
        height: AppSizes.heightPercentageToDP(7),
        minHeight: 55,
        width: '100%',
        borderWidth: 2,
        borderRadius: 10,
    },
    label: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.greyDark,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        backgroundColor: AppColors.light,
        textAlignVertical: 'center',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        paddingRight: 20,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
    },
});
