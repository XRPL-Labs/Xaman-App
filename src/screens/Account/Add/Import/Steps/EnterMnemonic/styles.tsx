import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    label: {
        fontFamily: AppFonts.base.familyBold,
        color: '$grey',
        fontSize: AppFonts.subtext.size,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    labelActive: {
        color: '$blue',
    },
    input: {
        flex: 1,
        textAlignVertical: 'center',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        paddingRight: 20,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    inputActive: {
        color: '$blue',
    },
    inputRowActive: {
        borderColor: '$lightBlue',
        backgroundColor: '$tint',
    },
    inputRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: AppSizes.heightPercentageToDP(6),
        backgroundColor: '$lightBlue',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '$transparent',
        marginVertical: 5,
    },
    optionsButton: {
        flex: 1,
        borderRadius: 20,
        paddingRight: 10,
        paddingLeft: 10,
        marginRight: 5,
        marginLeft: 2,
        marginTop: 5,
        marginBottom: 5,
    },
    optionsButtonSelected: {
        backgroundColor: '$blue',
    },
    optionsButtonText: {},
    optionsButtonSelectedText: {
        fontFamily: AppFonts.base.familyBold,
        color: '$white',
    },
});

export default styles;
