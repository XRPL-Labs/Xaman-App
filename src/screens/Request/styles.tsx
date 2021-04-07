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
    qrCodeContainer: {
        width: '90%',
        backgroundColor: '$tint',
        alignSelf: 'center',
        borderRadius: 20,
        marginBottom: 25,
    },
    qrCode: {
        borderRadius: 14,
        borderWidth: 5,
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: '$grey',
        padding: 5,
        margin: 30,
    },
    editButton: {
        justifyContent: 'center',
        alignSelf: 'center',
    },
    rowItem: {
        paddingHorizontal: AppSizes.paddingSml,
        paddingTop: AppSizes.paddingSml,
        paddingBottom: 10,
    },
    rowTitle: {
        paddingLeft: 10,
    },
    accountPickerContainer: {
        marginTop: Platform.OS === 'ios' ? 20 : 10,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 0,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$blue',
        paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 0,
        backgroundColor: '$lightGrey',
        borderRadius: 15,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: '$textPrimary',
        paddingVertical: 15,
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
