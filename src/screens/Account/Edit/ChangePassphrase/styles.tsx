import { StyleSheet } from 'react-native';

import StyleService from '@services/StyleService';
import { AppSizes, AppFonts } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
    },
    accountIcon: {
        width: AppSizes.screen.width * 0.07,
        height: AppSizes.screen.width * 0.07,
        tintColor: '$grey',
        resizeMode: 'contain',
    },
    rowIcon: {
        width: AppSizes.screen.width * 0.07,
        height: AppSizes.screen.width * 0.07,
        resizeMode: 'contain',
        tintColor: '$grey',
        marginRight: -10,
    },
    row: {
        width: '100%',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$white',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: '$grey',
    },
    label: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$black',
    },
    destructionLabel: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$red',
        textAlign: 'center',
    },
    value: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        textAlign: 'right',
        color: '$grey',
    },
    descriptionText: {
        padding: AppSizes.paddingSml,
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.base.size * 0.8,
        color: '$black',
    },
});

export default styles;
