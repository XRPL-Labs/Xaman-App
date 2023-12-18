import { StyleSheet } from 'react-native';

import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
        // backgroundColor: '$grey,
    },
    accountIcon: {
        width: AppSizes.screen.width * 0.07,
        height: AppSizes.screen.width * 0.07,
        tintColor: '$grey',
        resizeMode: 'contain',
    },
    rowIcon: {
        tintColor: '$blue',
        marginRight: -10,
    },
    row: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        backgroundColor: '$background',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: '$tint',
    },

    label: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
        paddingRight: AppSizes.padding,
    },
    destructionLabel: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$red',
        textAlign: 'center',
    },
    value: {
        flex: 1,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        textAlign: 'right',
        color: '$grey',
    },
    address: {
        flex: 1,
        fontFamily: AppFonts.base.familyMono,
        fontSize: AppFonts.small.size,
        textAlign: 'right',
        color: '$grey',
    },
    descriptionText: {
        padding: AppSizes.paddingSml,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
});

export default styles;
