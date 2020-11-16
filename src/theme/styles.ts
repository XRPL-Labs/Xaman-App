/**
 * App Styles
 */

/* eslint-disable spellcheck/spell-checker */
import { StyleSheet } from 'react-native';
import { IsIOS10 } from '@common/helpers/device';

import Colors from './colors';
import Fonts from './fonts';
import Sizes from './sizes';

export default StyleSheet.create({
    container: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'stretch',
    },
    tabContainer: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'stretch',
        marginBottom: Sizes.tabbarHeight,
    },
    headerContainer: {
        backgroundColor: Colors.transparent,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        height: Sizes.moderateScale(60),
        marginTop: IsIOS10() ? 20 : 0,
        paddingTop: 0,
        paddingHorizontal: Sizes.padding,
    },
    headerBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.grey,
    },
    contentContainer: {
        flex: 8,
        justifyContent: 'center',
        alignSelf: 'stretch',
    },
    windowSize: {
        height: Sizes.screen.height,
        width: Sizes.screen.width,
    },

    borderGrey: {
        borderWidth: 1,
        borderColor: Colors.grey,
    },
    borderGreen: {
        borderWidth: 1,
        borderColor: Colors.green,
    },
    borderRed: {
        borderWidth: 1,
        borderColor: Colors.red,
    },
    borderOrange: {
        borderWidth: 1,
        borderColor: Colors.orange,
    },

    buttonTransparent: {
        color: Colors.greyDark,
        borderColor: Colors.transparent,
        tintColor: Colors.greyDark,
        backgroundColor: Colors.transparent,
    },
    buttonBlue: {
        color: Colors.blue,
        borderColor: Colors.blue,
        tintColor: Colors.blue,
        backgroundColor: Colors.blue,
    },
    buttonBlueLight: {
        color: Colors.lightBlue,
        borderColor: Colors.lightBlue,
        tintColor: Colors.lightBlue,
        backgroundColor: Colors.lightBlue,
    },
    buttonGreen: {
        color: Colors.white,
        borderColor: Colors.green,
        tintColor: Colors.green,
        backgroundColor: Colors.green,
    },
    buttonRed: {
        color: Colors.red,
        borderColor: Colors.red,
        tintColor: Colors.red,
        backgroundColor: Colors.red,
    },
    buttonRedOutline: {
        color: Colors.red,
        borderColor: Colors.red,
        tintColor: Colors.red,
        backgroundColor: Colors.transparent,
    },
    buttonGrey: {
        color: Colors.greyDark,
        borderColor: Colors.greyDark,
        tintColor: Colors.greyDark,
        backgroundColor: Colors.greyDark,
    },
    buttonGreyOutline: {
        color: Colors.greyDark,
        borderColor: Colors.greyDark,
        tintColor: Colors.greyDark,
        backgroundColor: Colors.transparent,
    },
    buttonBlack: {
        color: Colors.black,
        borderColor: Colors.black,
        tintColor: Colors.white,
        backgroundColor: Colors.black,
    },

    colorWhite: { color: Colors.white },
    colorBlack: { color: Colors.black },
    colorBlue: { color: Colors.blue },
    colorGreen: { color: Colors.green },
    colorOrange: { color: Colors.orange },
    colorRed: { color: Colors.red },
    colorGreyDark: { color: Colors.greyDark },
    colorGreyBlack: { color: Colors.greyBlack },
    // colorPurple: { color: Colors.purple },
    // colorGreyBlue: { color: Colors.greyBlue },
    imgColorBlue: { tintColor: Colors.blue },
    imgColorGreen: { tintColor: Colors.green },
    imgColorWhite: { tintColor: Colors.white },
    imgColorBlack: { tintColor: Colors.black },
    imgColorGrey: { tintColor: Colors.grey },
    imgColorGreyDark: { tintColor: Colors.greyDark },
    imgColorRed: { tintColor: Colors.red },
    imgColorOrange: { tintColor: Colors.orange },
    imgColorGreyBlack: { tintColor: Colors.greyBlack },

    borderRadius: {
        borderRadius: 12,
    },

    // Aligning items
    leftAligned: {
        alignItems: 'flex-start',
    },
    centerAligned: {
        alignItems: 'center',
    },
    rightAligned: {
        alignItems: 'flex-end',
    },
    flexStart: {
        justifyContent: 'flex-start',
    },
    centerContent: {
        justifyContent: 'center',
    },
    flexEnd: {
        justifyContent: 'flex-end',
    },

    leftSelf: {
        alignSelf: 'flex-start',
    },
    centerSelf: {
        alignSelf: 'center',
    },
    rightSelf: {
        alignSelf: 'flex-end',
    },
    stretchSelf: {
        alignSelf: 'stretch',
    },

    // Text Styles
    baseText: {
        color: Colors.black,
        fontFamily: Fonts.base.family,
        fontSize: Fonts.base.size,
    },

    p: {
        fontFamily: Fonts.p.family,
        fontSize: Fonts.p.size,
        color: Colors.black,
    },
    pbold: {
        fontFamily: Fonts.pb.family,
        fontSize: Fonts.pb.size,
        color: Colors.black,
    },
    h1: {
        fontFamily: Fonts.h1.family,
        fontSize: Fonts.h1.size,
        color: Colors.black,
        margin: 0,
        marginBottom: 10,
        left: 0,
        right: 0,
    },
    h2: {
        fontFamily: Fonts.h2.family,
        fontSize: Fonts.h2.size,
        color: Colors.black,
        margin: 0,
        marginBottom: 8,
        left: 0,
        right: 0,
    },
    h3: {
        fontFamily: Fonts.h3.family,
        fontSize: Fonts.h3.size,
        color: Colors.black,
        margin: 0,
        marginBottom: 6,
        left: 0,
        right: 0,
    },
    h4: {
        fontFamily: Fonts.h4.family,
        fontSize: Fonts.h4.size,
        color: Colors.black,
        margin: 0,
        marginBottom: 4,
        left: 0,
        right: 0,
    },
    h5: {
        fontFamily: Fonts.h5.family,
        fontSize: Fonts.h5.size,
        color: Colors.black,
        margin: 0,
        marginTop: 4,
        marginBottom: 4,
        left: 0,
        right: 0,
    },
    strong: {
        fontFamily: Fonts.base.familyExtraBold,
    },
    bold: {
        fontFamily: Fonts.base.familyBold,
    },
    link: {
        textDecorationLine: 'underline',
        color: Colors.black,
    },
    subtext: {
        fontFamily: Fonts.subtext.family,
        fontSize: Fonts.subtext.size,
        color: Colors.black,
    },
    monoSubText: {
        fontFamily: Fonts.base.familyMono,
        fontSize: Fonts.subtext.size - 1,
        color: Colors.black,
    },
    mono: {
        fontFamily: Fonts.base.familyMono,
    },
    monoBold: {
        fontFamily: Fonts.base.familyMonoBold,
    },
    textOverflow: {
        overflow: 'hidden',
    },

    // Helper Text Styles
    textLeftAligned: {
        textAlign: 'left',
    },
    textCenterAligned: {
        textAlign: 'center',
    },
    textRightAligned: {
        textAlign: 'right',
    },

    // General HTML-like Elements
    hr: {
        left: 0,
        right: 0,
        borderBottomWidth: 1,
        borderBottomColor: Colors.grey,
        height: 1,
        backgroundColor: Colors.transparent,
    },

    // Give me padding
    padding: {
        paddingVertical: Sizes.padding,
        paddingHorizontal: Sizes.padding,
    },
    paddingHorizontal: {
        paddingHorizontal: Sizes.padding,
    },
    paddingLeft: {
        paddingLeft: Sizes.padding,
    },
    paddingRight: {
        paddingRight: Sizes.padding,
    },
    paddingVertical: {
        paddingVertical: Sizes.padding,
    },
    paddingTop: {
        paddingTop: Sizes.padding,
    },
    paddingBottom: {
        paddingBottom: Sizes.padding,
    },
    paddingExtraSml: {
        paddingVertical: Sizes.paddingExtraSml,
        paddingHorizontal: Sizes.paddingExtraSml,
    },
    paddingSml: {
        paddingVertical: Sizes.paddingSml,
        paddingHorizontal: Sizes.paddingSml,
    },
    paddingHorizontalSml: {
        paddingHorizontal: Sizes.paddingSml,
    },
    paddingLeftSml: {
        paddingLeft: Sizes.paddingSml,
    },
    paddingRightSml: {
        paddingRight: Sizes.paddingSml,
    },
    paddingVerticalSml: {
        paddingVertical: Sizes.paddingSml,
    },
    paddingTopSml: {
        paddingTop: Sizes.paddingSml,
    },
    paddingBottomSml: {
        paddingBottom: Sizes.paddingSml,
    },

    // Give me margin
    margin: {
        marginVertical: Sizes.padding,
        marginHorizontal: Sizes.padding,
    },
    marginHorizontal: {
        marginHorizontal: Sizes.padding,
    },
    marginLeft: {
        marginLeft: Sizes.padding,
    },
    marginRight: {
        marginRight: Sizes.padding,
    },
    marginVertical: {
        marginVertical: Sizes.padding,
    },
    marginTop: {
        marginTop: Sizes.padding,
    },
    marginBottom: {
        marginBottom: Sizes.padding,
    },
    marginSml: {
        marginVertical: Sizes.paddingSml,
        marginHorizontal: Sizes.paddingSml,
    },
    marginHorizontalSml: {
        marginHorizontal: Sizes.paddingSml,
    },
    marginLeftSml: {
        marginLeft: Sizes.paddingSml,
    },
    marginRightSml: {
        marginRight: Sizes.paddingSml,
    },
    marginVerticalSml: {
        marginVertical: Sizes.paddingSml,
    },
    marginTopSml: {
        marginTop: Sizes.paddingSml,
    },
    marginBottomSml: {
        marginBottom: Sizes.paddingSml,
    },

    // Grid
    row: {
        left: 0,
        right: 0,
        flexDirection: 'row',
    },
    column: {
        left: 0,
        right: 0,
        flexDirection: 'column',
    },
    flex1: {
        flex: 1,
    },
    flex2: {
        flex: 2,
    },
    flex3: {
        flex: 3,
    },
    flex4: {
        flex: 4,
    },
    flex5: {
        flex: 5,
    },
    flex6: {
        flex: 6,
    },
    flex7: {
        flex: 7,
    },
    flex8: {
        flex: 8,
    },
    flex9: {
        flex: 9,
    },

    // Others
    overlayHeader: {
        flex: 1,
        flexDirection: 'row',
        position: 'absolute',
        zIndex: 2,
        top: 0,
        left: 0,
        width: Sizes.screen.width,
        padding: 10,
    },

    buttonFooter: {
        borderTopWidth: 1,
        borderTopColor: Colors.grey,
        // paddingTop: 25,
        borderBottomWidth: 1,
        borderBottomColor: Colors.grey,
        paddingBottom: 25,
        // paddingHorizontal: 10,
        paddingTop: 10,
        marginBottom: 10,
        // paddingBottom: 10,
    },

    pageHeader: {
        marginTop: 30,
        paddingTop: 20,
        // borderWidth: 1,
        // borderColor: Colors.orange,
    },

    // Big icon
    bigIcon: {
        fontSize: 70,
        width: 80,
        height: 80,
        marginBottom: 30,
    },

    // Slide up modal
    shadowContent: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.black,
    },
    panelHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    panelHandle: {
        width: 40,
        height: 6,
        borderRadius: 4,
        backgroundColor: Colors.greyDark,
    },

    // Empty view
    emptyIcon: {
        // width: Sizes.screen.width * 0.4,
        // height: Sizes.screen.width * 0.4,
        width: Sizes.scale(140),
        height: Sizes.scale(140),
        alignSelf: 'center',
        marginBottom: 20,
    },
    emptyText: {
        width: '90%',
        fontSize: Fonts.base.size,
        fontFamily: Fonts.base.familyBold,
        textAlign: 'center',
        paddingBottom: Sizes.padding,
        paddingHorizontal: Sizes.padding,
        alignSelf: 'center',
    },
    BackgroundShapes: {
        resizeMode: 'contain',
    },
    BackgroundShapesWH: {
        width: '100%',
        height: '100%',
    },
});
