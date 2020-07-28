import { StyleSheet } from 'react-native';

import { AppColors, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleSheet.create({
    pickerContainer: {
        borderRadius: 15,
        padding: 5,
        backgroundColor: AppColors.light,
    },
    pickerContainerExpanded: {
        backgroundColor: AppColors.white,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    pickerDropDownContainer: {
        maxHeight: AppSizes.screen.heightHalf,
        position: 'absolute',
        width: '100%',
        padding: 5,
        backgroundColor: AppColors.white,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: AppColors.greyDark,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    pickerDropDownItem: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: AppColors.transparent,
        // padding: 10,
        // paddingTop: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
        // borderTopWidth: 1,
        // borderTopColor: AppColors.grey,
    },
    pickerDropDownItemActive: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: AppColors.lightBlue,
        // padding: 10,
        // paddingHorizontal: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
    },
    collapseButton: {
        backgroundColor: AppColors.black,
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: AppColors.white,
    },
    checkMarkContainer: {
        width: 40,
        alignSelf: 'center',
    },
    checkMarkIcon: {
        alignSelf: 'center',
        tintColor: AppColors.blue,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: AppColors.transparent,
    },
});
