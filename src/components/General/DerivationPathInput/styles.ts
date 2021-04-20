import StyleService from '@services/StyleService';

import { AppFonts, AppSizes } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        backgroundColor: '$tint',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 10,
        borderColor: '$lightGrey',
        height: AppSizes.heightPercentageToDP(7),
        minHeight: 55,
        width: '100%',
        borderWidth: 2,
        borderRadius: 10,
    },
    label: {
        fontFamily: AppFonts.base.familyBold,
        color: '$grey',
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        backgroundColor: '$tint',
        textAlignVertical: 'center',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        paddingRight: 20,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$blue',
    },
});
