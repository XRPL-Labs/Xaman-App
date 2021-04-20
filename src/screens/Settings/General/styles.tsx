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
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: '$tint',
    },
    rowNoBorder: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: AppSizes.paddingSml,
    },
    labelContainer: {
        flex: 3,
        height: '100%',
        justifyContent: 'center',
    },
    label: {
        fontFamily: AppFonts.base.family,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
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
        color: '$textPrimary',
    },

    themeItem: {
        // minHeight: AppSizes.screen.height * 0.12,
        width: '100%',
        borderRadius: 20,
        padding: 5,
        paddingLeft: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$tint',
        borderColor: '$tint',
        color: '$grey',
        borderWidth: 3,
        marginBottom: 5,
    },
    themeItemDot: {
        height: 26,
        width: 26,
        borderRadius: 15,
        borderWidth: 2,
        backgroundColor: '$tint',
        borderColor: '$grey',
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeItemDotSelected: {
        backgroundColor: '$white',
        borderColor: '$blue',
    },
    themePreview: {
        borderRadius: 10,
        height: '100%',
        padding: AppSizes.paddingSml,
        alignItems: 'center',
    },
    themePreviewLight: { backgroundColor: '$white', color: '$black' },
    themePreviewDark: { backgroundColor: '$themeDark', color: '$white' },
    themePreviewMoonlight: { backgroundColor: '$themeMoonlight', color: '$grey' },
    themePreviewRoyal: { backgroundColor: '$themeRoyal', color: '$white' },

    themeItemFilled: {
        height: 15,
        width: 15,
        borderRadius: 8,
        backgroundColor: '$blue',
        color: '$blue',
    },

    themeItemSelected: {
        backgroundColor: '$lightBlue',
        borderColor: '$blue',
        color: '$blue',
    },
    themeItemLabelText: {
        fontFamily: AppFonts.base.familyExtraBold,
        fontSize: AppFonts.p.size,
        color: '$silver',
    },
    themeItemSelectedText: {
        color: '$textPrimary',
    },
    themeItemLabelSmall: {
        fontSize: AppFonts.subtext.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$silver',
    },
});

export default styles;
