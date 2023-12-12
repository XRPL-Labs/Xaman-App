import Realm from 'realm';

export type ExtendedSchemaType = {
    schema: Realm.ObjectSchema;
    populate?: (realm: Realm) => void;
    migration?: (oldRealm: Realm, newRealm: Realm) => void;
};

export enum AccountTypes {
    Regular = 'Regular', // XRPL Regular account
    Tangem = 'Tangem', // Tangem Card account
}

export enum EncryptionLevels {
    Physical = 'Physical', // used physical device to store the secret
    Passphrase = 'Passphrase', // used passphrase to encrypt the secret
    Passcode = 'Passcode', // use hashed passcode to encrypt the secrets
    None = 'None', // WARNING: this is not secure
}

export enum AccessLevels {
    Full = 'Full', // have full access and can sign the transaction
    Readonly = 'Readonly', // just readonly access
}

export enum BiometryType {
    FaceID = 'FaceID',
    TouchID = 'TouchID',
    Biometrics = 'Biometrics',
    None = 'None',
}

export enum NetworkType {
    Main = 'Mainnet',
    Test = 'Testnet',
    Dev = 'Devnet',
    Custom = 'Custom',
}

export enum NetworkRailsChangesType {
    AddedNetwork = 'AddedNetwork',
    RemovedNetwork = 'RemovedNetwork',
    AddedNode = 'AddedNode',
    RemovedNode = 'RemovedNode',
    ChangedProperty = 'ChangedProperty',
}

export type NetworkRailsChanges = { [key: string]: { type: NetworkRailsChangesType; value: string }[] };

export type Themes = 'light' | 'dark' | 'moonlight' | 'royal';
