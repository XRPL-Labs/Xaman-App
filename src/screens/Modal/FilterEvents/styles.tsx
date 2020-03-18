import { StyleSheet } from 'react-native';

import { AppColors, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    // container: { position: 'relative', flex: 1, flexDirection: 'column', backgroundColor: AppColors.lightBlue },
    row: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    headerContainer: {
        zIndex: 9999,
        backgroundColor: AppColors.white,
        shadowColor: AppColors.white,
        shadowOffset: { width: 0, height: 12 },
        shadowRadius: 5,
        shadowOpacity: 1,
        elevation: 1,
    },
    footerContainer: {
        backgroundColor: AppColors.white,
        shadowColor: AppColors.white,
        shadowOffset: { width: 0, height: -10 },
        shadowRadius: 5,
        shadowOpacity: 1,
        elevation: 10,
    },
    cancelButton: {
        backgroundColor: AppColors.black,
    },
    cancelButtonText: {
        fontFamily: AppFonts.base.familyBold,
        color: AppColors.white,
    },
    optionsButton: {
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
