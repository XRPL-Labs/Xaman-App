import { Platform } from 'react-native';

import StyleService from '@services/StyleService';
import { AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$background',
    },
    currencySymbolTextPad: {
        marginTop: 4,
    },
    currencyChevronIcon: {
        tintColor: '$grey',
        marginTop: 2,
    },
    qrCodeContainer: {
        width: '100%',
        borderColor: '$tint',
        borderWidth: 3,
        backgroundColor: '$white',
        alignSelf: 'center',
        borderRadius: 10,
        marginBottom: 25,
        marginTop: 10,
    },
    sharebtnLeft: {
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 0,
        height: 40,
        borderTopEndRadius: 0,
        borderBottomEndRadius: 0,
    },
    sharebtnRight: {
        marginTop: 8,
        marginBottom: 8,
        paddingVertical: 0,
        height: 40,
        borderTopStartRadius: 0,
        borderBottomStartRadius: 0,
    },
    qrImgContainer: {
        // borderWidth: 1,
        // borderColor: 'red',
        position: 'absolute',
        top: 70,
        transform: [ { translateY: -70 } ],
    },
    qrCode: {
        // alignSelf: 'center',
        alignItems: 'center',
        borderColor: '$silver',
        // padding: 10,
        margin: Platform.select({
            ios: 15,
            android: 0,
        }),
        height: 140,
        overflow: 'hidden',
    },
    editButton: {
        justifyContent: 'center',
        alignSelf: 'center',
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml * 0.5,
        paddingBottom: 10,
    },
    checkboxView: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
    },
    checkboxLabelContainer: {
        flex: 1,
    },
    checkboxWrapper: {
        width: 33,
        height: 28,
        position: 'relative',
        overflow: 'hidden',
    },
    checkboxContainer: {
        // flex: 1,
        // flexGrow: 0,
        // flexShrink: 0,
        // marginLeft: 'auto',
    },
    checkbox: {
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    rowTitle: {
        // paddingLeft: 10,
    },
    accountPickerContainer: {
        marginTop: Platform.OS === 'ios' ? 20 : 10,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 10 : 10,
        paddingLeft: 20,
        marginLeft: 0,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h3.size,
        fontFamily: AppFonts.base.familyMonoBold,
        // fontWeight: '600',
        color: '$blue',
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 5 : 5,
        paddingLeft: 20,
        marginLeft: 0,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h5.size,
        fontFamily: AppFonts.base.familyMono,
        // fontWeight: '600',
        color: '$textPrimary',
        paddingVertical: 10,
    },
    currencySymbolTextContainer: {
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
    },
    currencySymbolText: {
        fontFamily: AppFonts.base.familyMonoBold,
        color: '$grey',
        fontSize: AppFonts.h5.size * 0.9,
    },
});

export default styles;
