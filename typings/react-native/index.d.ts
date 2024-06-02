/* eslint-disable max-len */

import { NativeModule } from 'react-native';

/**
 * Manage foreground notifications
 */
export interface LocalNotificationModuleInterface extends NativeModule {
    /**
     * Sets the badge count
     *
     * @param badge - The number to set as the badge count.
     * @returns A Promise that resolves to a boolean indicating whether the operation was successful.
     */
    setBadge: (badge: number) => Promise<boolean>;

    /**
     * Retrieves the current badge count.
     *
     * @returns A Promise that resolves to the current badge count as a number.
     */
    getBadge: () => Promise<number>;

    /**
     * Marks a notification message as complete
     *
     * @param messageId - The unique identifier of the notification message.
     * @param show - A boolean indicating whether to show or hide the completed message.
     * @returns A boolean indicating whether the operation was successful.
     */
    complete: (messageId: string, show: boolean) => boolean;
}

/**
 * Bunch of methods for managing the application
 */
export interface AppUtilsModuleInterface extends NativeModule {
    /**
     * The version of the app.
     */
    appVersion: string;

    /**
     * The build number of the app.
     */
    buildNumber: string;

    /**
     * Indicates whether the application is running in debug mode.
     */
    isDebug: boolean;

    /**
     * Checks if blocking screenshots enabled
     * @returns A Promise that resolves to `true` if taking screenshot is blocked, otherwise `false`.
     * #### (Android specific)
     */
    isFlagSecure: () => Promise<boolean>;

    /**
     * Sets the blocking screenshot in the application.
     * @param entry - A boolean entry indicating whether to set the secure flag.
     * #### (Android specific)
     */
    setFlagSecure: (entry: boolean) => void;

    /**
     * Restarts the app bundle.
     */
    restartBundle: () => void;

    /**
     * Exits the app.
     */
    exitApp: () => void;

    /**
     * Sets a timeout event with the specified key and delay.
     * @param key - The key to identify the timeout event.
     * @param delay - The delay in milliseconds before the timeout event is triggered.
     */
    timeoutEvent: (key: string, delay: number) => void;
}

export interface CryptoModuleInterface extends NativeModule {
    /**
     * Synchronously generates a random key of the specified length and returns it as a hexadecimal string in uppercase.
     * @param length The length of the random key to generate.
     * @returns The generated random key as a hexadecimal string in uppercase.
     */
    randomKeySync: (length: number) => string;

    /**
     * Asynchronously generates a random key of the specified length and returns it as a Promise of a hexadecimal string in uppercase.
     * @param length The length of the random key to generate.
     * @returns A Promise that resolves to the generated random key as a hexadecimal string in uppercase.
     */
    randomKey: (length: number) => Promise<string>;

    /**
     * Computes the SHA-512 hash of the given entry and returns it as a Promise of a hexadecimal string.
     * @param entry The entry to hash.
     * @returns A Promise that resolves to the hexadecimal SHA-512 hash of the input entry.
     */
    sha512: (entry: string) => Promise<string>;

    /**
     * Computes the SHA-256 hash of the given entry and returns it as a Promise of a hexadecimal string.
     * @param entry The entry to hash.
     * @returns A Promise that resolves to the hexadecimal SHA-256 hash of the input entry.
     */
    sha256: (entry: string) => Promise<string>;

    /**
     * Computes the SHA-1 hash of the given entry and returns it as a Promise of a hexadecimal string.
     * @param entry The entry to hash.
     * @returns A Promise that resolves to the hexadecimal SHA-1 hash of the input entry.
     */
    sha1: (entry: string) => Promise<string>;

    /**
     * Computes the HMAC-SHA-256 hash of the given entry with the specified key and returns it as a Promise of a hexadecimal string.
     * @param entry The entry to hash.
     * @param key The HMAC key as a hexadecimal string.
     * @returns A Promise that resolves to the hexadecimal HMAC-SHA-256 hash of the input entry with the specified key.
     */
    hmac256: (entry: string, key: string) => Promise<string>;
}

/**
 * Managing app updates
 */
export interface AppUpdateModuleInterface extends NativeModule {
    /**
     * Checks for updates and resolves with a numeric value.
     * @returns A Promise that resolves with a numeric value (e.g., 123) if an update is available.
     */
    checkUpdate: () => Promise<number>;

    /**
     * Starts the update process.
     * @returns A Promise that resolves when the update process is started.
     * #### (Android specific)
     */
    startUpdate: () => Promise<void>;
}

/**
 * Managing SharedPreferences datastore
 * Not encrypted local datastore
 */
export interface SharedPreferencesModuleInterface extends NativeModule {
    /**
     * Retrieves a value from SharedPreferences using the specified key.
     * @param key - The key to retrieve the value for.
     * @returns A Promise that resolves with the retrieved value
     */
    get: (key: string) => Promise<string>;

    /**
     * Sets a value in SharedPreferences using the specified key and value.
     * @param key - The key to set the value for.
     * @param value - The value to set.
     * @returns A Promise that resolves to `true` when the operation is successful.
     */
    set: (key: string, value: string) => Promise<boolean>;

    /**
     * Deletes a value from SharedPreferences using the specified key.
     * @param key - The key to delete the value for.
     * @returns A Promise that resolves to `true` when the operation is successful.
     */
    del: (key: string) => Promise<boolean>;
}

/**
 * Showing a toast message in app
 */
export interface ToastModuleInterface extends NativeModule {
    /**
     * Shows a toast message with the specified parameters.
     * @param message - The message to display in the toast.
     * @param duration - The duration for which the toast should be displayed.
     * @param gravity - The gravity or position of the toast.
     * @returns `true` if the toast was successfully shown.
     */
    showWithGravity: (message: string, duration: any, gravity: number) => boolean;
}

/**
 * Getting details from device
 */
export interface DeviceUtilsModuleInterface extends NativeModule {
    /**
     * Represents layout insets with top and bottom properties.
     */
    layoutInsets: {
        top: number;
        bottom: number;
    };

    /**
     * The brand of the device (e.g., 'Apple').
     */
    brand: string;

    /**
     * The model of the device (e.g., 'iPhone13,4').
     */
    model: string;

    /**
     * The operating system version of the device (e.g., '15,5').
     */
    osVersion: string;

    /**
     * Retrieves the elapsed real-time in milliseconds.
     * Note: this value will be reset to zero when device is rebooted
     * @returns A Promise that resolves with the elapsed real-time value (e.g., '1337').
     */
    getElapsedRealtime: () => Promise<string>;

    /**
     * Checks if the device is jailBroken.
     * @returns A Promise that resolves to `true` if the device is jailBroken.
     * #### (iOS specific)
     */
    isJailBroken: () => Promise<boolean>;

    /**
     * Checks if the device is rooted.
     * @returns A Promise that resolves to `true` if the device is rooted.
     * #### (Android specific)
     */
    isRooted: () => Promise<boolean>;

    /**
     * Retrieves the time zone of the device (e.g., 'Europe/Amsterdam').
     * @returns A Promise that resolves with the time zone string.
     */
    getTimeZone: () => Promise<string>;

    /**
     * Retrieves local settings.
     * @returns A Promise that resolves with device local settings object.
     */
    getLocalSetting: () => Promise<{
        delimiter: string;
        languageCode: string;
        locale: string;
        separator: string;
    }>;
}

/**
 * Unique ID provider for this device
 */
export interface UniqueIdProviderModuleInterface extends NativeModule {
    /**
     * Retrieves the device's unique identifier.
     * @returns The device's unique identifier as a string (e.g., 'e988b7a9-f685-4674-87bc-0ad52a52faa5').
     * iOS: UUIDV4 & Android: Hex
     */
    getDeviceUniqueId: () => string;
}

/**
 * Trigger HapticFeedback on the device
 */
export interface HapticFeedbackModuleInterface extends NativeModule {
    /**
     * Triggers haptic feedback based on the specified type.
     * @param type - The type of haptic feedback to trigger.
     */
    trigger: (
        type:
            | 'impactLight'
            | 'impactMedium'
            | 'impactHeavy'
            | 'notificationSuccess'
            | 'notificationWarning'
            | 'notificationError',
    ) => void;
}

/**
 * Managing the secure app vault
 */
interface VaultManagerModuleInterface extends NativeModule {
    /**
     * The latest encryption cipher version.
     */
    latestCipherVersion: number;

    /**
     * Retrieves the storage encryption key.
     * @returns A Promise resolving to the storage encryption key.
     */
    getStorageEncryptionKey(): Promise<string>;

    /**
     * Checks if the storage encryption key exists.
     * @returns A Promise resolving to true if the key exists, otherwise false.
     */
    isStorageEncryptionKeyExist(): Promise<boolean>;

    /**
     * Creates a vault.
     * @param vaultName - The name of the vault.
     * @param entry - The entry for the vault.
     * @param key - The key for the vault.
     * @returns A Promise resolving to true if the vault is created successfully.
     */
    createVault(vaultName: string, entry: string, key: string): Promise<boolean>;

    /**
     * Opens and decrypts a vault.
     * @param vaultName - The name of the vault to open.
     * @param key - The key for the vault.
     * @returns A Promise resolving to the clear text from the vault.
     */
    openVault(vaultName: string, key: string): Promise<string>;

    /**
     * Checks if a vault exists.
     * @param vaultName - The name of the vault to check.
     * @returns A Promise resolving to true if the vault exists, otherwise false.
     */
    vaultExist(vaultName: string): Promise<boolean>;

    /**
     * Purges a vault.
     * @param vaultName - The name of the vault to purge.
     * @returns A Promise resolving to true if the vault is purged successfully.
     */
    purgeVault(vaultName: string): Promise<boolean>;

    /**
     * Re-keys a vault.
     * @param vaultName - The name of the vault to re-key.
     * @param oldKey - The old key for the vault.
     * @param newKey - The new key for the vault.
     * @returns A Promise resolving to true if the vault is re-keyed successfully.
     */
    reKeyVault(vaultName: string, oldKey: string, newKey: string): Promise<boolean>;

    /**
     * Re-keys multiple vaults in a batch.
     * @param vaultNames - An array of vault names to re-key.
     * @param oldKey - The old key for the vaults.
     * @param newKey - The new key for the vaults.
     * @returns A Promise resolving to true if the vaults are re-keyed successfully.
     */
    reKeyBatchVaults(vaultNames: string[], oldKey: string, newKey: string): Promise<boolean>;

    /**
     * Clears storage.
     * @returns A Promise resolving to true if storage is cleared successfully.
     */
    clearStorage(): Promise<boolean>;

    /**
     * Checks if migration is required for a vault.
     * @param vaultName - The name of the vault to check.
     * @returns A Promise resolving to an object containing migration information.
     */
    isMigrationRequired(vaultName: string): Promise<{
        vault: string;
        current_cipher_version: number;
        latest_cipher_version: number;
        migration_required: boolean;
    }>;
}

/**
 * Represents keyboard module interface.
 * @interface
 */
interface KeyboardModuleInterface extends NativeModule {
    /**
     * Starts the keyboard visibility listener.
     *
     * @returns {void}
     */
    startKeyboardListener(): void;
    /**
     * Stops listening for keyboard visibility events.
     *
     * @function stopKeyboardListen
     * @returns {void}
     */
    stopKeyboardListen(): void;
}

interface GooglePlayPurchase {
    purchaseToken: string;
    products: Array<string>;
    quantity: number;
    orderId?: string;
}

interface AppStorePayment {
    transactionIdentifier: string;
    productIdentifier: string;
    quantity: number;
    applicationUsername?: string;
}

type InAppPurchaseReceipt = GooglePlayPurchase | AppStorePayment;

/**
 * Interface for the In-App Purchase module.
 * @interface
 * @extends NativeModule
 */
interface InAppPurchaseModuleInterface extends NativeModule {
    /**
     * Starts a connection with Google BillingClient
     *
     * @return {Promise<boolean>}
     * Android specific
     */
    startConnection(): Promise<boolean>;
    /**
     * Checks if there are any previous purchases
     * that have been made but not yet finalize
     *
     * @returns {Promise<Array<string>>}
     */
    restorePurchases(): Promise<Array<InAppPurchaseReceipt>>;
    /**
     * Launches the billing flow for specific product ID.
     *
     * @return {Promise<Array<string>>}
     */
    purchase(productId: string): Promise<Array<InAppPurchaseReceipt>>;
    /**
     * finalize a purchase, indicating that the product has been provided to the user.
     *
     * @return {Promise<string>}
     */
    finalizePurchase(transactionReceiptIdentifier: string): Promise<string>;
}

/**
 * Represents prompt android module interface.
 * @interface
 */
interface PromptAndroidInterface extends NativeModule {
    /**
     * Constants
     */
    buttonClicked: string;
    dismissed: string;
    buttonPositive: string;
    buttonNegative: string;
    buttonNeutral: string;

    /**
     * Displays a prompt with customizable options.
     *
     * @param {object} options - The options for configuring the prompt.
     * @param callback
     * @param {string} [options.title] - The title of the prompt.
     * @param {string} [options.message] - The message displayed in the prompt.
     * @param {string} [options.buttonPositive] - The text label for the positive button.
     * @param {string} [options.buttonNegative] - The text label for the negative button.
     * @param {string} [options.buttonNeutral] - The text label for the neutral button.
     * @param {string[]} [options.items] - The list of items to display as options in a list prompt.
     * @param {boolean} [options.cancelable] - A flag indicating whether the prompt can be canceled by the user.
     * @param {string} [options.type] - The type of the prompt (e.g., "default", "numeric", "email").
     * @param {string} [options.style] - The style of the prompt (e.g., "light", "dark").
     * @param {string} [options.defaultValue] - The default value to prefill the input field with.
     * @param {string} [options.placeholder] - The placeholder text for the input field.
     *
     * @return {void}
     */
    promptWithArgs(
        options: {
            title?: string;
            message?: string;
            buttonPositive?: string;
            buttonNegative?: string;
            buttonNeutral?: string;
            items?: string[];
            cancelable?: boolean;
            type?: string;
            style?: string;
            defaultValue?: string;
            placeholder?: string;
        },
        callback: (action: 'buttonClicked', buttonKey: string, input: string) => void,
    ): void;
}

declare module 'react-native' {
    interface NativeModulesStatic {
        VaultManagerModule: VaultManagerModuleInterface;
        HapticFeedbackModule: HapticFeedbackModuleInterface;
        UniqueIdProviderModule: UniqueIdProviderModuleInterface;
        DeviceUtilsModule: DeviceUtilsModuleInterface;
        ToastModule: ToastModuleInterface;
        SharedPreferencesModule: SharedPreferencesModuleInterface;
        AppUpdateModule: AppUpdateModuleInterface;
        CryptoModule: CryptoModuleInterface;
        AppUtilsModule: AppUtilsModuleInterface;
        LocalNotificationModule: LocalNotificationModuleInterface;
        InAppPurchaseModule: InAppPurchaseModuleInterface;
        KeyboardModule: KeyboardModuleInterface;
        PromptAndroid: PromptAndroidInterface;
    }
}
