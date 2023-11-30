/**
 * App Styles
 */

/* eslint-disable spellcheck/spell-checker */

import StyleService from '@services/StyleService';

import Fonts from './fonts';
import Sizes from './sizes';

export default StyleService.create({
    container: {
        position: 'relative',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'stretch',
        backgroundColor: '$background',
    },
    tabContainer: {
        flex: 1,
        position: 'relative',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'stretch',
        paddingTop: Sizes.safeAreaTopInset,
        backgroundColor: '$background',
    },
    headerContainer: {
        backgroundColor: '$transparent',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        height: Sizes.moderateScale(60),
        marginTop: 0,
        paddingTop: 0,
        paddingHorizontal: Sizes.padding,
    },
    headerBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '$grey',
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
        borderColor: '$grey',
    },
    borderGreen: {
        borderWidth: 1,
        borderColor: '$green',
    },
    borderRed: {
        borderWidth: 1,
        borderColor: '$red',
    },
    borderOrange: {
        borderWidth: 1,
        borderColor: '$orange',
    },

    buttonTransparent: {
        borderColor: '$transparent',
        tintColor: '$grey',
        backgroundColor: '$transparent',
    },
    buttonBlue: {
        borderColor: '$blue',
        tintColor: '$blue',
        backgroundColor: '$blue',
    },
    buttonBlueLight: {
        borderColor: '$lightBlue',
        tintColor: '$lightBlue',
        backgroundColor: '$lightBlue',
    },
    buttonGreen: {
        borderColor: '$green',
        tintColor: '$green',
        backgroundColor: '$green',
    },
    buttonRed: {
        borderColor: '$red',
        tintColor: '$red',
        backgroundColor: '$red',
    },
    buttonRedOutline: {
        borderColor: '$red',
        tintColor: '$red',
        backgroundColor: '$transparent',
    },
    buttonGrey: {
        borderColor: '$grey',
        tintColor: '$grey',
        backgroundColor: '$grey',
    },
    buttonSilver: {
        borderColor: '$silver',
        tintColor: '$silver',
        backgroundColor: '$silver',
    },
    buttonLight: {
        borderColor: '$light',
        tintColor: '$light',
        backgroundColor: '$light',
    },
    buttonBlack: {
        borderColor: '$black',
        tintColor: '$white',
        backgroundColor: '$black',
    },

    colorPrimary: { color: '$textPrimary' },
    colorContrast: { color: '$textContrast' },
    colorWhite: { color: '$white' },
    colorBlack: { color: '$black' },
    colorBlue: { color: '$blue' },
    colorGreen: { color: '$green' },
    colorOrange: { color: '$orange' },
    colorRed: { color: '$red' },
    colorGrey: { color: '$grey' },
    colorSilver: { color: '$silver' },

    imgColorPrimary: { tintColor: '$textPrimary' },
    imgColorContrast: { tintColor: '$textContrast' },
    imgColorBlue: { tintColor: '$blue' },
    imgColorGreen: { tintColor: '$green' },
    imgColorWhite: { tintColor: '$white' },
    imgColorBlack: { tintColor: '$black' },
    imgColorGrey: { tintColor: '$grey' },
    imgColorSilver: { tintColor: '$silver' },
    imgColorRed: { tintColor: '$red' },
    imgColorOrange: { tintColor: '$orange' },

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
        color: '$textPrimary',
        fontFamily: Fonts.base.family,
        fontSize: Fonts.base.size,
    },

    p: {
        fontFamily: Fonts.p.family,
        fontSize: Fonts.p.size,
        color: '$textPrimary',
    },
    pbold: {
        fontFamily: Fonts.pb.family,
        fontSize: Fonts.pb.size,
        color: '$textPrimary',
    },
    h1: {
        fontFamily: Fonts.h1.family,
        fontSize: Fonts.h1.size,
        color: '$textPrimary',
        margin: 0,
        marginBottom: 10,
        left: 0,
        right: 0,
    },
    h2: {
        fontFamily: Fonts.h2.family,
        fontSize: Fonts.h2.size,
        color: '$textPrimary',
        margin: 0,
        marginBottom: 8,
        left: 0,
        right: 0,
    },
    h3: {
        fontFamily: Fonts.h3.family,
        fontSize: Fonts.h3.size,
        color: '$textPrimary',
        margin: 0,
        marginBottom: 6,
        left: 0,
        right: 0,
    },
    h4: {
        fontFamily: Fonts.h4.family,
        fontSize: Fonts.h4.size,
        color: '$textPrimary',
        margin: 0,
        marginBottom: 4,
        left: 0,
        right: 0,
    },
    h5: {
        fontFamily: Fonts.h5.family,
        fontSize: Fonts.h5.size,
        color: '$textPrimary',
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
        color: '$textPrimary',
    },
    subtext: {
        fontFamily: Fonts.subtext.family,
        fontSize: Fonts.subtext.size,
        color: '$textPrimary',
    },
    monoSubText: {
        fontFamily: Fonts.base.familyMono,
        fontSize: Fonts.subtext.size - 1,
        color: '$textPrimary',
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
        borderBottomColor: '$lightGrey',
        height: 1,
        backgroundColor: '$transparent',
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
    paddingHorizontalExtraSml: {
        paddingHorizontal: Sizes.paddingExtraSml,
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
        borderTopColor: '$grey',
        // paddingTop: 25,
        borderBottomWidth: 1,
        borderBottomColor: '$grey',
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
        // borderColor: '$orange,
    },

    // Big icon
    bigIcon: {
        fontSize: 70,
        width: 80,
        height: 80,
        marginBottom: 30,
    },

    // Empty view
    emptyIcon: {
        resizeMode: 'contain',
        width: Sizes.scale(140),
        height: Sizes.scale(140),
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'visible',
    },
    emptyText: {
        width: '90%',
        fontSize: Fonts.base.size,
        fontFamily: Fonts.base.familyBold,
        textAlign: 'center',
        paddingBottom: Sizes.padding,
        paddingHorizontal: Sizes.padding,
        alignSelf: 'center',
        color: '$textPrimary',
    },
    BackgroundShapes: {
        resizeMode: 'contain',
        opacity: 0.4,
        tintColor: StyleService.select({ light: '$black', dark: '$tint' }),
    },
    BackgroundShapesWH: {
        width: '100%',
        height: '100%',
    },
});
