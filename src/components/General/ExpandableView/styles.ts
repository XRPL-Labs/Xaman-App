import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        width: '100%',
        backgroundColor: '$tint',
        borderRadius: 15,
    },
    titleContainer: {
        backgroundColor: '$lightGrey',
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        padding: 10,
    },
    footerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
        backgroundColor: '$lightGrey',
        borderBottomRightRadius: 15,
        borderBottomLeftRadius: 15,
    },
    contentContainer: {
        backgroundColor: '$tint',
        borderRightWidth: 2,
        borderLeftWidth: 2,
        borderColor: '$tint',
    },
    expandIcon: {
        tintColor: '$contrast',
    },
});
