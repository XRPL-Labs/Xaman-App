import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    letterBlockWapper: {
        // borderLeftWidth: 6,
        borderColor: '$transparent',
    },
    letterBlockText: {
        fontFamily: AppFonts.base.familyBold,
        color: '$white',
        lineHeight: 25,
        fontSize: 17,
    },
    letterBlock: {
        // borderWidth: 1,
        // borderColor: '#ffcc99',
        backgroundColor: '$orange',
        paddingHorizontal: 16,
        // paddingVertical: 1,
        borderRadius: 20,
        marginBottom: 10,
        position: 'relative',
        top: 0,
    },
});
