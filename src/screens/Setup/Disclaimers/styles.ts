import StyleService from '@services/StyleService';

import { AppSizes } from '@theme';

const styles = StyleService.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '$background',
    },
    contentContainer: {
        flex: 1,
        padding: 35,
    },
    logo: {
        width: AppSizes.screen.width * 0.4,
        height: AppSizes.screen.height * 0.1,
        resizeMode: 'contain',
    },
    footerStyle: {
        height: 120,
        width: '100%',
        flexDirection: 'row',
        padding: 0,
        borderTopWidth: 5,
        borderColor: '$tint',
    },
    footerContent: {
        width: '90%',
        height: '100%',
        justifyContent: 'center',
    },
    progressBar: {
        position: 'absolute',
        left: 0,
        top: -5,
    },
});

export default styles;
