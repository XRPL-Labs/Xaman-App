import StyleService from '@services/StyleService';

import { AppStyles, AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    inputText: {
        fontSize: AppStyles.p.fontSize,
        fontFamily: AppStyles.monoBold.fontFamily,
        color: '$blue',
        paddingLeft: 15,
    },
    inputContainer: {
        borderWidth: 1,
        borderColor: '$lightGrey',
    },
    sectionHeader: {
        backgroundColor: '$background',
        paddingTop: 5,
        paddingBottom: 5,
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
});

export default styles;
