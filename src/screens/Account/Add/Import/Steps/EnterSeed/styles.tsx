// import { StyleSheet } from 'react-native';

import StyleService from '@services/StyleService';
import { AppStyles, AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    inputText: {
        // textAlign: 'left',
        fontFamily: AppStyles.mono.fontFamily,
    },
    inputTextEmpty: {
        fontFamily: AppFonts.base.family,
    },
    textInput: {
        borderColor: 'transparent',
        borderWidth: 0,
        width: '100%',
    }, 
    value: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        textAlign: 'right',
        color: '$grey',
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        paddingVertical: AppSizes.paddingSml,
        // borderBottomWidth: StyleSheet.hairlineWidth,
        // borderTopWidth: StyleSheet.hairlineWidth,
        // borderColor: '$tint',
    },
    label: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    rowIcon: {
        tintColor: '$grey',
        marginRight: -10,
    },
});

export default styles;
