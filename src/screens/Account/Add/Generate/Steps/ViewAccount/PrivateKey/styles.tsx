import StyleService from '@services/StyleService';
import { AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    privateKeyRowId: {
        backgroundColor: '$white',
        // paddingTop: 4,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        paddingRight: 15,
        color: '$grey',
    },
    privateKeyRowIdActive: {
        color: '$orange',
    },
    rowStyle: {
        marginBottom: 6,
        width: '90%',
    },
    rowStyleInner: {
        borderRadius: 10,
        overflow: 'hidden',
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderColor: '$grey',
    },
    rowStyleInnerActive: {
        borderRadius: 10,
        overflow: 'hidden',
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderColor: '$lightOrange',
    },
    borderLeft: {
        borderLeftWidth: 1,
    },
    privateKeyNum: {
        backgroundColor: '$grey',
        borderColor: '$grey',
        padding: 2,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        justifyContent: 'center',
    },
    privateKeyNumText: {
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
    },

    // Active states
    privateKeyRowActive: {
        backgroundColor: '$red',
    },
    privateKeyNumActive: {
        backgroundColor: '$lightOrange',
        // borderWidth: 2,
        borderColor: '$orange',
        // borderColor: '$grey,
    },
    privateKeyNumTextActive: {
        color: '$orange',
    },

    rowAlphabetContainer: {},
});

export default styles;
