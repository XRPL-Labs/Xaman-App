import { AppScreens } from '@common/constants';

export type { Props as ScanModalProps } from './types';

/**
 * RNN registration stub. Do not statically import ScanModal here:
 * ScanModal → CameraScanner → react-native-vision-camera, and vision-camera
 * enumerates cameras at module scope. Loading that graph at startup turns a
 * camera-API failure into a launch crash.
 */
function loadScanModal() {
    return require('./ScanModal').default;
}

const Scan = {
    screenName: AppScreens.Modal.Scan,
    load: loadScanModal,
};

export default Scan;
