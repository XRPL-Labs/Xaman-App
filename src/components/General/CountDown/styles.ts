import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        borderRadius: 11,
        backgroundColor: '$tint',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        backgroundColor: '$grey',
    },
    image: {
        borderRadius: 11,
    },
    border: {
        borderColor: '$lightGrey',
        borderWidth: 1,
    },
    badgeContainer: {
        position: 'absolute',
    },
    badgeContainerText: {
        position: 'absolute',
        backgroundColor: '$blue',
        borderWidth: 2.5,
        borderColor: '$background',
    },
    badge: {
        tintColor: '$white',
    },
});
