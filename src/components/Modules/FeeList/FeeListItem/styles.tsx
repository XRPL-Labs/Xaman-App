import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    item: {
        width: '100%',
        borderRadius: 20,
        padding: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: '$lightGrey',
        color: '$silver',
        borderWidth: 3,
        marginBottom: 20,
    },
    dot: {
        height: 26,
        width: 26,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '$grey',
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dotSelected: {
        borderColor: '$contrast',
    },
    filled: {
        height: 15,
        width: 15,
        borderRadius: 8,
        backgroundColor: '$contrast',
        color: '$contrast',
    },
    selected: {
        backgroundColor: '$tint',
        borderColor: '$blue',
    },
    label: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$grey',
    },
    value: {
        fontFamily: AppFonts.base.familyMonoBold,
        fontSize: AppFonts.base.size,
        color: '$grey',
    },
    labelSmall: {
        fontSize: AppFonts.small.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$grey',
    },
    descriptionText: {
        marginTop: 4,
    },
});

export default styles;
