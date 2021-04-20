import { StyleSheet } from 'react-native';

import StyleService from '@services/StyleService';
import { AppSizes } from '@theme';

/* Styles ==================================================================== */
export default StyleService.create({
    pickerContainer: {
        borderRadius: 15,
        padding: 5,
        backgroundColor: '$tint',
    },
    pickerContainerExpanded: {
        backgroundColor: '$tint',
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    pickerDropDownContainer: {
        maxHeight: AppSizes.screen.heightHalf,
        position: 'absolute',
        width: '100%',
        padding: 5,
        backgroundColor: '$tint',
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: '$grey',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 8,
        shadowOpacity: 0.1,
        elevation: 1,
    },
    pickerDropDownItem: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: '$transparent',
        // padding: 10,
        // paddingTop: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
        // borderTopWidth: 1,
        // borderTopColor: '$grey,
    },
    pickerDropDownItemActive: {
        height: 70,
        marginTop: 2,
        borderRadius: 12,
        backgroundColor: '$lightBlue',
        // padding: 10,
        // paddingHorizontal: 12,
        // paddingVertical: 13,
        paddingHorizontal: 12,
    },
    collapseButton: {
        backgroundColor: '$black',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: '$white',
    },
    checkMarkContainer: {
        width: 40,
        alignSelf: 'center',
    },
    checkMarkIcon: {
        alignSelf: 'center',
        tintColor: '$blue',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '$transparent',
    },
});
