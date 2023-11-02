/* eslint-disable */

/* eslint-disable  */

const NetInfo = jest.mock('@react-native-community/netinfo');

// @ts-ignore
NetInfo.addEventListener = jest.fn((state) => {
    return jest.fn();
});
// @ts-ignore
NetInfo.fetch = jest.fn(
    () =>
        new Promise((resolve, reject) => {
            resolve({ type: 'wifi', isConnected: 'true' });
        }),
);

export default NetInfo;
