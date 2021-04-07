import StyleService from '@services/StyleService';

import { AppSizes, AppFonts } from '@theme';
/* Styles ==================================================================== */
const styles = StyleService.create({
    visibleContent: {
        // height: Sizes.screen.heightHalf + 100,
        height: AppSizes.heightPercentageToDP(92),
        backgroundColor: '$background',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderColor: '$tint',
        borderWidth: 1,
        shadowColor: '$black',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 5,
        shadowOpacity: 0.3,
        padding: 15,
        alignItems: 'stretch',
    },
    cancelButton: {
        height: AppSizes.screen.heightHalf * 0.1,
        backgroundColor: '$grey',
    },
    reserveAmount: {
        fontSize: AppFonts.base.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$grey',
        // fontWeight: 'bold',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyItemCard: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 10,
    },
    currencyItem: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingRight: 5,
        justifyContent: 'space-between',
        flexDirection: 'row',
    },
    currencyItemLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    currencyItemLabelSmall: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyMono,
        alignItems: 'flex-start',
        justifyContent: 'center',
        marginRight: 10,
        marginBottom: 3,
        // borderWidth: 1,
        // borderColor: 'red',
    },
    xrpAvatar: {
        resizeMode: 'contain',
    },
    xrpAvatarContainer: {
        padding: 10,
        marginRight: 10,
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$lightGrey',
        borderRadius: 8,
        justifyContent: 'center',
    },
    trustLineInfoIcon: {
        tintColor: '$grey',
        marginRight: 5,
    },
    rowTitle: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.p.size,
        color: '$textPrimary',
    },
    rowLabel: {
        fontFamily: AppFonts.base.familyBold,
        fontSize: AppFonts.subtext.size,
        color: '$textPrimary',
    },
    rowLabelSmall: {
        fontSize: AppFonts.subtext.size * 0.8,
        fontFamily: AppFonts.base.familyMono,
        color: '$grey',
    },
    listHeader: {
        paddingVertical: 5,
        backgroundColor: '$white',
    },
    currencyAvatar: {
        width: AppSizes.moderateScale(16),
        height: AppSizes.moderateScale(16),
    },
});

export default styles;
