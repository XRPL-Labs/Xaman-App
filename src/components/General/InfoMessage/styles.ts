import StyleService from '@services/StyleService';

import { AppFonts } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderRadius: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    containerFlat: {
        borderRadius: 0,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    iconContainer: {
        paddingRight: 10,
        alignItems: 'center',
    },
    footerContainer: {
        flex: 1,
        paddingRight: 10,
        alignItems: 'center',
    },
    labelContainer: {
        flex: 1,
        paddingVertical: 10,
    },
    label: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        textAlign: 'center',
    },
    info: {
        backgroundColor: '$lightBlue',
        borderColor: '$blue',
        tintColor: '$blue',
    },
    infoIcon: { tintColor: '$blue' },
    warning: {
        backgroundColor: '$lightOrange',
        borderColor: '$orange',
        tintColor: '$orange',
    },
    warningIcon: { tintColor: '$orange' },
    error: {
        backgroundColor: '$lightRed',
        borderColor: '$lightRed',
        tintColor: '$red',
    },
    errorIcon: { tintColor: '$red' },
    success: {
        backgroundColor: '$lightGreen',
        borderColor: '$lightGreen',
        tintColor: '$green',
    },
    successIcon: { tintColor: '$green' },
    neutral: {
        backgroundColor: '$light',
        borderColor: '$light',
        tintColor: '$grey',
    },
    neutralIcon: { tintColor: '$grey' },
    moreInfoButton: {
        marginVertical: 8,
    },
});
