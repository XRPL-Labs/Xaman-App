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
    scrollStickyHeader: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        backgroundColor: '$background',
        shadowColor: '$background',
        paddingHorizontal: AppSizes.paddingSml,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 5,
        shadowOpacity: 1,
    },
    objectItemCard: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        marginTop: 10,
    },
    currencyLabel: {
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$textPrimary',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    xrpAvatar: {
        resizeMode: 'contain',
    },
    brandAvatarContainer: {
        marginRight: 10,
    },
    iconContainer: {
        padding: 10,
        marginRight: 10,
        backgroundColor: '$white',
        borderWidth: 1,
        borderColor: '$lightGrey',
        borderRadius: 10,
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
    rowLabelBig: {
        fontSize: AppFonts.p.size,
        fontFamily: AppFonts.base.familyBold,
        color: '$textPrimary',
    },
    listHeader: {
        paddingVertical: 5,
        backgroundColor: '$white',
    },
    separatorLine: {
        marginTop: 10,
    },
    readonlyInfoMessageLabel: {
        fontSize: AppFonts.small.size,
        color: '$red',
    },
});

export default styles;
