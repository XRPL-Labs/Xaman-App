import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    image: {
        borderRadius: 10,
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
