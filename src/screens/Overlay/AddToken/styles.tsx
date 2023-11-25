import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: AppSizes.padding,
    },
    cancelButton: {
        height: AppSizes.screen.heightHalf * 0.1,
        backgroundColor: '$grey',
    },
    avatar: {
        width: AppSizes.moderateScale(30),
        height: AppSizes.moderateScale(30),
        resizeMode: 'contain',
    },
    currencyAvatar: {
        width: AppSizes.moderateScale(30),
        height: AppSizes.moderateScale(30),
        resizeMode: 'contain',
    },
    separator: {
        borderLeftWidth: 1.2,
        borderLeftColor: '$lightBlue',
        marginHorizontal: 10,
    },
    listItem: {
        height: AppSizes.moderateScale(50),
        paddingRight: 5,
        paddingLeft: 10,
        marginVertical: 4,
        borderRadius: 10,
    },
    selectedRow: {
        backgroundColor: '$tint',
    },
    selectedText: {
        color: '$blue',
        fontFamily: AppFonts.base.familyBold,
    },
    text: {
        color: '$black',
    },
    footer: {
        alignItems: 'center',
        marginBottom: AppSizes.padding,
    },
});

export default styles;
