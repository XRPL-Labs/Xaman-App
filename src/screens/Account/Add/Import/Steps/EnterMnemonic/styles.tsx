import { StyleSheet } from 'react-native';

import { AppSizes, AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    label: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.greyDark,
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    labelActive: {
        color: AppColors.blue,
    },
    input: {
        flex: 1,
        textAlignVertical: 'center',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        paddingRight: 20,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
    },
    inputActive: {
        color: AppColors.blue,
    },
    inputRowActive: {
        borderColor: AppColors.blue,
        backgroundColor: AppColors.white,
    },
    inputRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: AppSizes.heightPercentageToDP(6),
        backgroundColor: AppColors.lightBlue,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: AppColors.transparent,
        marginVertical: 5,
    },
    optionsButton: {
        flex: 1,
        backgroundColor: AppColors.grey,
        borderRadius: 20,
        paddingRight: 10,
        paddingLeft: 10,
        marginRight: 5,
        marginLeft: 2,
        marginTop: 5,
        marginBottom: 5,
    },
    optionsButtonText: {
        paddingRight: 10,
        paddingLeft: 10,
        color: AppColors.black,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size,
    },
    optionsButtonSelected: {
        backgroundColor: AppColors.blue,
    },
    optionsButtonSelectedText: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.white,
    },
});

export default styles;
