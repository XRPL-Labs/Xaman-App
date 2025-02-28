import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    lpContainer: {
        // borderWidth: 1,
        // borderColor: 'red',
        width: 35,
        height: 35,
        borderRadius: 3,
    },
    dualAvatar: {
        // borderRadius: 200,
        // width: 23,
        // height: 23,
        // backgroundColor: '$light',
    },
    miniAvatar: {
        backgroundColor: '$light',
        borderRadius: 50,
    },
    avatar1: {
        position: 'absolute',
        top: -1,
        left: -2,
    },
    avatar2: {
        position: 'absolute',
        left: 14,
        top: 12,
    },
});
