/* eslint-disable  */

const AsyncStorage = jest.mock('@react-native-community/async-storage');

const DATA = {
    XUMM:
        '{"cipher":"pjtU6ArLdca61em0u5JKKTvXFq8uld+RvP7NaXU1obtl7GTj1GwADutKsaAcT0T7Pr64QS3Qc8pANTRc0gV9SprPLrDUeVa5I/C3+f2fU9bJM5G7pKrWtrP/5GWEc0c1gQITa882cQBZsk93Xu2aeRIRCkNEIOFbTGtgc/WxLic=","iv":"30399535f64190e348ce460880af4a691b9b2492baa19de52651aa0be39e4e1b"}',
    XUMM_VERSION: '2',
};
// @ts-ignore
AsyncStorage.getItem = jest.fn((key) => Promise.resolve(DATA[key]));
// @ts-ignore
AsyncStorage.setItem = jest.fn(() => Promise.resolve());
// @ts-ignore
AsyncStorage.removeItem = jest.fn(() => Promise.resolve());

export default AsyncStorage;
