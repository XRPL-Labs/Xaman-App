import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    visibleContent: {
        height: AppSizes.heightPercentageToDP(92),
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderColor: '$tint',
        borderWidth: 1,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
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
        marginBottom: AppSizes.navigationBarHeight * 1.7,
    },
});

export default styles;
