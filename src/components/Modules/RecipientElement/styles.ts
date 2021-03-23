import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';
/* Styles ==================================================================== */
export default StyleService.create({
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        marginBottom: 8,
        backgroundColor: '$tint',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '$tint',
    },
    itemSelected: {
        borderColor: '$blue',
        borderWidth: 2,
        backgroundColor: '$lightBlue',
    },
    title: {
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
        fontSize: AppFonts.base.size,
    },
    selectedText: {
        color: '$blue',
    },
    subtitle: {
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
        fontSize: AppFonts.base.size * 0.8,
    },
    tag: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 5,
        marginLeft: 5,
        alignSelf: 'center',
    },
    tagLabel: {
        color: '$white',
        fontSize: AppFonts.small.size * 0.7,
        fontFamily: AppFonts.base.familyBold,
    },
    bithompTag: {
        backgroundColor: '$bithomp',
    },
    xrplnsTag: {
        backgroundColor: '$xrplns',
    },
    xrpscanTag: {
        backgroundColor: '$xrpscan',
    },
    payidTag: {
        backgroundColor: '$payid',
    },
    destinationTagContainer: {
        marginTop: 10,
        paddingTop: 10,
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '$grey',
    },
});
