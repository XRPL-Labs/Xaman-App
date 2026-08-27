import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    placeholder: {
        backgroundColor: '$grey',
    },
    hideZero: {
        color: '$contrast',
        opacity: 0,
        paddingRight: 1,
    },
});
