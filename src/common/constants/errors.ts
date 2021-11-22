/**
 * App Error Messages
 */

export default {
    // Defaults
    default: 'Hmm, an unknown error occurred',
    timeout: 'Server Timed Out. Check your internet connection',
    invalidJson: 'Response returned is not valid JSON',
    notImplemented: 'Not Implemented Yet!',

    transactions404: 'No Transaction ',
    transactionNotFound: 'Can not load transaction!',

    storageDecryptionFailed:
        'The secure XUMM datastore could not be decrypted. ' +
        'This is usually the case when you restored your phone from a backup or migrated to a new phone.\n\n' +
        'Sometimes it may take a while for the restore process to finish the transfer of security codes. ' +
        'Try again later, or wipe XUMM and import your accounts with their secrets again.',
    appAlreadyRunningInDifferentProcess:
        'The secure XUMM datastore could not be opened. ' +
        'This can occur when the OS tries to update XUMM to a new version. Please force quit and relaunch XUMM.',
};
