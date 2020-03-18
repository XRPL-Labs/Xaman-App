import { StyleSheet } from 'react-native';

import { AppColors, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    // container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    iconAccount: {
        marginRight: 15,
        opacity: 0.4,
    },
    iconAccountActive: {
        marginRight: 15,
        opacity: 1,
    },
    accountRow: {
        paddingRight: 20,
        paddingLeft: 20,
        paddingTop: 6,
        paddingBottom: 6,
        // marginTop: 5,
        // marginBottom: 5,
        height: AppSizes.scale(60),
        borderRadius: AppSizes.scale(60) / 3,
        // borderRadius: 20,
        // borderBottomWidth: 1,
        // borderBottomColor: AppColors.red,
    },
    accountRowSelected: {
        // borderWidth: 2,
        // borderColor: AppColors.green,
        borderBottomWidth: 0,
        borderRadius: 20,
        backgroundColor: AppColors.lightGreen,
    },
    selectedText: {
        marginRight: 10,
        color: AppColors.green,
    },
    regularKey: {
        flexDirection: 'row',
        paddingHorizontal: 7,
        paddingVertical: 5,
        marginLeft: 10,
        borderRadius: 5,
        backgroundColor: AppColors.lightBlue,
        overflow: 'hidden',
    },
    iconKey: {
        tintColor: AppColors.blue,
        marginRight: 5,
        // borderWidth: 1,
        // borderColor: AppColors.red,
        alignSelf: 'center',
    },
    regularKeyText: {
        textAlign: 'left',
        fontSize: 10,
        fontFamily: AppFonts.subtext.family,
        color: AppColors.blue,
        paddingTop: 1,
    },
    radioCircle: {
        width: AppSizes.scale(25),
        height: AppSizes.scale(25),
        borderWidth: 2,
        borderColor: AppColors.grey,
        borderRadius: AppSizes.scale(25) / 2,
    },
    radioCircleSelected: {
        width: AppSizes.scale(25),
        height: AppSizes.scale(25),
        borderWidth: AppSizes.scale(6),
        borderColor: AppColors.green,
        borderRadius: AppSizes.scale(25) / 2,
        backgroundColor: AppColors.white,
    },
    switchButton: {
        backgroundColor: AppColors.black,
    },
    switchButtonText: {
        fontSize: AppFonts.base.size * 0.8,
    },
    addAccountButton: {
        alignSelf: 'flex-end',
    },
});

export default styles;
