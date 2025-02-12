import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    pickerContainer: {
        borderRadius: 15,
        // backgroundColor: '$tint',
        height: 40,
        // paddingHorizontal: 17,
        justifyContent: 'center',
    },
    collapseButton: {
        // backgroundColor: '$black',
        borderRadius: 8,
        height: 25,
        width: 40,
        justifyContent: 'center',
        alignSelf: 'center',
        // marginTop: 5,
    },
    collapseIcon: {
        alignSelf: 'center',
        tintColor: '$dark',
    },
});
