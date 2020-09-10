/* eslint-disable  spellcheck/spell-checker */

const DeviceInfo = jest.mock('react-native-device-info');

// @ts-ignore
DeviceInfo.getModel = () => 'mock-device';
// @ts-ignore
DeviceInfo.getDeviceId = () => 'mock-device-id';
// @ts-ignore
DeviceInfo.getVersion = () => '0.5.1';
// @ts-ignore
DeviceInfo.getBuildNumber = () => 1;
// @ts-ignore
DeviceInfo.getUniqueID = () => 'e988b7a9-f685-4674-87bc-0ad52a52faa5';
// @ts-ignore
DeviceInfo.getDeviceLocale = () => 'en_US';
// @ts-ignore
DeviceInfo.getReadableVersion = () => 'foo';

export default DeviceInfo;
