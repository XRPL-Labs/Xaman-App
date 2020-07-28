import { StyleSheet } from 'react-native';

import { AppFonts, AppSizes, AppColors } from '@theme';

const styles = StyleSheet.create({
    container: {
        width: '92%',
        backgroundColor: AppColors.transparent,
        justifyContent: 'center',
    },
    hiddenInput: {
        height: 0,
        width: 0,
    },
    containerPin: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    pinInput: {
        flex: 1,
        height: AppSizes.verticalScale(55),
        maxHeight: 70,
        backgroundColor: AppColors.white,
        justifyContent: 'center',
        marginLeft: 5,
        marginRight: 5,
        borderRadius: AppSizes.verticalScale(10),
        borderColor: AppColors.greyDark,
        borderWidth: 1,
    },
    pinInputActive: {
        borderColor: AppColors.blue,
        backgroundColor: AppColors.lightBlue,
        textAlign: 'center', // <-- the magic
    },
    pinText: {
        color: AppColors.blue,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyBold,
        textAlign: 'center',
    },
});

export default styles;
