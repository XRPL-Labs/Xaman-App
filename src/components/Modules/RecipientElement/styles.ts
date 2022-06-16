import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        marginBottom: 8,
        backgroundColor: '$tint',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$tint',
    },
    containerSelected: {
        borderColor: '$blue',
        borderWidth: 2,
        backgroundColor: '$lightBlue',
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
        marginTop: 8,
        paddingTop: 8,
        paddingBottom: 2,
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '$lightGrey',
    },
});
