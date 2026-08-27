import StyleService from '@services/StyleService';
// import { StyleSheet } from 'react-native';
// import { AppSizes } from '@theme';

const styles = StyleService.create({
    container: {
        // width: AppSizes.screen.width, // Will auto width - this fixes Fold devices
        marginTop: -10,
        paddingTop: 10,
    },
    contentContainerStyle: {
        flexGrow: 0,
    },
    topShadowContainer: {
        overflow: 'hidden',
    },
    topShadow: {
        marginTop: -30,
        left: 0,
        height: 30,
        right: 0,
        backgroundColor: '$background',
        zIndex: 10,
        shadowColor: '$background',
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 3,
        shadowOpacity: 1,
        elevation: 6,
    },
    item: {
        position: 'absolute',
        zIndex: 9,
        width: '100%',
    },
});

export default styles;
