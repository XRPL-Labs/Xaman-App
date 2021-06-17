import { StyleSheet } from 'react-native';
import StyleService from '@services/StyleService';

/* Styles ==================================================================== */
export default StyleService.create({
    image: {
        borderRadius: 10,
        backgroundColor: '$textContrast',
    },
    border: {
        borderColor: '$lightGrey',
        borderWidth: StyleSheet.hairlineWidth,
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
