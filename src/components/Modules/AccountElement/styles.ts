import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        marginBottom: 0,
        // backgroundColor: '$tint',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$transparent',
    },
    centerContent: {
        paddingLeft: 10,
    },
    nameText: {
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
        fontSize: AppFonts.base.size,
    },
    selectedText: {
        color: '$blue',
    },
    addressText: {
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
        fontSize: AppFonts.small.size,
    },
    destinationTagContainer: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 8,
        paddingBottom: 2,
        paddingRight: 2,
        borderTopWidth: 1,
        borderTopColor: '$lightGrey',
    },
    destinationTagText: {
        flex: 1,
        flexWrap: 'wrap',
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.subtext.size - 1,
        color: '$grey',
    },
});
