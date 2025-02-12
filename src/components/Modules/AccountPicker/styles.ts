import StyleService from '@services/StyleService';

import { AppStyles, AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    pickerContainer: {
        borderRadius: 8,
        // backgroundColor: '$tint',
        height: 40,
        paddingHorizontal: 0,
        justifyContent: 'center',
    },
    collapseButton: {
        // backgroundColor: '$black',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: '$fark',
    },
    accountItemTitle: {
        fontSize: AppStyles.baseText.fontSize,
        fontWeight: 'bold',
        marginBottom: 3,
        color: '$textPrimary',
    },
    accountItemSub: {
        fontFamily: AppFonts.base.familyMono,
        fontSize: 16,
        color: '$grey',
    },
});
