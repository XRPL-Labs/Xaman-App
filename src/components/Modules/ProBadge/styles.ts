import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    proBadgeContainer: {
        flexDirection: 'row',
        backgroundColor: '#FEF7E2',
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 5,
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proBadgeLabel: {
        color: '$black',
        fontSize: AppFonts.small.size * 0.75,
        fontFamily: AppFonts.base.familyExtraBold,
        paddingLeft: 1,
        paddingRight: 2,
    },
});
