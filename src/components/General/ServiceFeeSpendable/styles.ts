import StyleService from '@services/StyleService';
import { AppSizes } from '@theme/index';

// import { AppFonts } from '@theme';

const styles = StyleService.create({
    container: {
        width: '100%',
        // borderWidth: 2,
        // borderColor: '$red',
    },
    textContainer: {
        paddingHorizontal: 0,
        marginHorizontal: 0,
        paddingVertical: 0,
        marginVertical: 0,
        marginBottom: AppSizes.padding,
        // borderWidth: 1,
        // borderColor: '$green',
    },
    textItem: {
        textAlign: 'center',
    },
    icon: {
        alignSelf: 'center',
        marginBottom: AppSizes.paddingExtraSml,
        marginTop: -AppSizes.paddingSml,
        tintColor: '$orange',
    },
    title: {
        color: '$contrast',
    },
});

export default styles;
