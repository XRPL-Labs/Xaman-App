import StyleService from '@services/StyleService';

import { HasBottomNotch } from '@common/helpers/device';

const styles = StyleService.create({
    container: {
        flex: 1,
        backgroundColor: '$transparent',
        height: HasBottomNotch() ? 75 : 45,
        alignItems: 'center',
        flexDirection: 'row',
        marginBottom: HasBottomNotch() ? 0 : 12,
    },
    leftContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        paddingLeft: 30,
    },
    rightContent: {
        flex: 1,
        paddingRight: 20,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        paddingLeft: 40,
    },
    dot: {
        backgroundColor: '$silver',
        borderRadius: 5,
        width: 10,
        height: 10,
        margin: 4,
    },
    nextDisabled: {
        color: '$grey',
    },
    readyText: {
        color: '$blue',
    },
});

export default styles;
