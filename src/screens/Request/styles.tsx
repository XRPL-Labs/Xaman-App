import { StyleSheet, Platform } from 'react-native';
import { AppColors, AppFonts, AppSizes } from '@theme';

/* Styles ==================================================================== */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.white,
    },
    qrCodeContainer: {
        borderRadius: 14,
        borderWidth: 5,
        alignSelf: 'center',
        alignItems: 'center',
        borderColor: AppColors.grey,
        padding: 5,
        margin: 10,
        marginBottom: 25,
    },
    qrCode: {
        borderRadius: 5,
        borderWidth: 5,
        borderColor: AppColors.light,
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
        paddingLeft: 15,
    },
    accountPickerContainer: {
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 15,
    },
    amountContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 15,
    },
    amountInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h2.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.blue,
        paddingVertical: Platform.OS === 'ios' ? 15 : 10,
    },
    amountRateContainer: {
        left: 0,
        right: 0,
        flexDirection: 'row',
        marginTop: Platform.OS === 'ios' ? 20 : 10,
        paddingLeft: 20,
        marginLeft: 15,
        backgroundColor: AppColors.lightGrey,
        borderRadius: 15,
    },
    amountRateInput: {
        padding: 0,
        margin: 0,
        fontSize: AppFonts.h4.size,
        fontFamily: AppFonts.base.familyMonoBold,
        fontWeight: '600',
        color: AppColors.black,
        paddingVertical: 15,
    },
    currencySymbolTextContainer: {
        justifyContent: 'center',
        alignSelf: 'center',
        marginRight: 15,
    },
    currencySymbolText: {
        fontFamily: AppFonts.base.familyMonoBold,
        color: AppColors.greyDark,
        fontSize: AppFonts.h5.size * 0.9,
    },
});

export default styles;
