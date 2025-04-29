import StyleService from '@services/StyleService';

import { AppStyles, AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    accountList: {
        marginLeft: -7, // For selection of Account
        marginRight: -7, // For selection of Account
    },
    restoreMarginRight: {
        marginRight: 7,
    },
    paddingHorizontal: {
        paddingHorizontal: 25,
    },
    inputText: {
        fontSize: AppStyles.p.fontSize,
        fontFamily: AppStyles.baseText.fontFamily,
        // fontWeight: 400,
        // color: '$blue',
        color: StyleService.select({ dark: '$white', light: '$blue' }), // #95037
        paddingLeft: 5,
    },
    inputContainer: {
        // marginTop: 5, // Makes the QR button move
        // borderWidth: 1,
        // borderColor: '$lightGrey',
    },
    sectionHeader: {
        backgroundColor: '$background',
        paddingTop: 5,
        paddingBottom: 5,
        marginLeft: 7,
        shadowColor: '$white',
    },
    listEmptyContainer: {
        flex: 1,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    clearSearchButton: {
        height: AppSizes.scale(25),
        paddingHorizontal: 10,
        alignSelf: 'flex-end',
    },
    clearSearchButtonText: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$blue',
        paddingLeft: 1,
        paddingRight: 0,
    },
    accountElementSelected: {
        borderColor: '$blue',
        borderWidth: 2,
        backgroundColor: '$lightBlue',
    },
    accountElementSelectedText: {
        color: '$blue',
    },
});

export default styles;
