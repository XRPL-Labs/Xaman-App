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
    header: {
        paddingVertical: AppSizes.paddingSml / 1.5,
        borderBottomWidth: 0,
        borderTopWidth: 0,
        backgroundColor: '$tint',
        marginTop: AppSizes.paddingSml / 2,
        marginBottom: AppSizes.paddingSml / 2,
    },
    rowIcon: {
        width: AppSizes.screen.width * 0.07,
        height: AppSizes.screen.width * 0.07,
        resizeMode: 'contain',
        tintColor: '$blue',
        marginRight: -10,
    },
    row: {
        width: '100%',
        paddingHorizontal: AppSizes.paddingSml,
        paddingVertical: AppSizes.paddingSml,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '$background',
        // borderBottomWidth: StyleSheet.hairlineWidth,
        // borderTopWidth: StyleSheet.hairlineWidth,
        // borderColor: '$tint',
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
        color: '$textSecondary',
    },
    descriptionText: {
        padding: AppSizes.paddingSml,
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.base.size,
        color: '$textPrimary',
    },
});

export default styles;
