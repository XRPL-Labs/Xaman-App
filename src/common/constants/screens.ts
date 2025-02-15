/**
 * Global App Screens
 */

const screens = {
    Onboarding: 'app.Onboarding',
    Setup: {
        Passcode: 'app.Setup.Passcode',
        Biometric: 'app.Setup.Biometric',
        PushNotification: 'app.Setup.PushNotification',
        Finish: 'app.Setup.Finish',
    },
    TabBar: {
        Home: 'app.TabBar.Home',
        Events: 'app.TabBar.Events',
        Actions: 'app.TabBar.Actions',
        XApps: 'app.TabBar.XApps',
        Settings: 'app.TabBar.Settings',
    },
    Account: {
        Add: 'app.Account.Add',
        Generate: 'app.Account.Generate',
        Import: 'app.Account.Import',
        List: 'app.Account.List',
        Edit: {
            Settings: 'app.Account.Settings',
            ChangePassphrase: 'app.Account.ChangePassphrase',
            ChangeTangemSecurityEnforce: 'app.Account.ChangeTangemSecurityEnforce',
        },
        Migration: {
            CipherMigration: 'app.Account.Migration.CipherMigration',
        },
    },
    Modal: {
        ReviewTransaction: 'modal.ReviewTransaction',
        FilterEvents: 'modal.FilterEvents',
        Scan: 'modal.Scan',
        Submit: 'modal.Submit',
        CurrencyPicker: 'modal.CurrencyPickerModal',
        Help: 'modal.Help',
        MigrationExplain: 'modal.MigrationExplain',
        XAppBrowser: 'modal.XAppBrowser',
        DestinationPicker: 'modal.DestinationPicker',
        TransactionLoader: 'modal.TransactionLoader',
        PurchaseProduct: 'modal.PurchaseProduct',
    },
    Overlay: {
        SwitchAccount: 'overlay.SwitchAccount',
        AddToken: 'overlay.AddToken',
        TokenSettings: 'overlay.TokenSettings',
        Vault: 'overlay.Vault',
        Auth: 'overlay.Auth',
        Lock: 'overlay.lock',
        Alert: 'overlay.Alert',
        FlaggedDestination: 'overlay.FlaggedDestination',
        ShareAccount: 'overlay.ShareAccount',
        RequestDecline: 'overlay.RequestDecline',
        EnterDestinationTag: 'overlay.EnterDestinationTag',
        ExplainBalance: 'overlay.ExplainBalance',
        ChangeLog: 'overlay.ChangeLog',
        ConnectionIssue: 'overlay.ConnectionIssue',
        ParticipantMenu: 'overlay.ParticipantMenu',
        ConfirmDestinationTag: 'overlay.ConfirmDestinationTag',
        SelectAccount: 'overlay.SelectAccount',
        SelectCurrency: 'overlay.SelectCurrency',
        SelectFee: 'overlay.SelectFee',
        HomeActions: 'overlay.HomeActions',
        CriticalProcessing: 'overlay.CriticalProcessing',
        PassphraseAuthentication: 'overlay.PassphraseAuthentication',
        SwitchAssetCategory: 'overlay.SwitchAssetCategory',
        SwitchNetwork: 'overlay.SwitchNetwork',
        XAppInfo: 'overlay.XAppInfo',
        NetworkRailsSync: 'overlay.NetworkRailsSync',
    },
    Transaction: {
        Payment: 'app.Transaction.Payment',
        Request: 'app.Transaction.Request',
        Details: 'app.Transaction.Details',
        Exchange: 'app.Transaction.Exchange',
    },
    Settings: {
        AddressBook: {
            List: 'app.Settings.AddressBook.List',
            Add: 'app.Settings.AddressBook.Add',
            Edit: 'app.Settings.AddressBook.Edit',
        },
        Network: {
            List: 'app.Settings.Network.List',
        },
        ThirdPartyApps: {
            List: 'app.Settings.ThirdPartyApps.List',
            Edit: 'app.Settings.ThirdPartyApps.Edit',
        },
        SessionLog: 'app.Settings.SessionLog',
        DeveloperSettings: 'app.Settings.DeveloperSettings',
        General: 'app.Settings.General',
        Advanced: 'app.Settings.Advanced',
        Security: 'app.Settings.Security',
        ChangePasscode: 'app.Settings.Security.ChangePasscode',
        TermOfUse: 'app.Settings.TermOfUse',
        Credits: 'app.Settings.Credits',
    },
    Global: {
        Picker: 'app.global.Picker',
        Placeholder: 'app.global.Placeholder',
    },
} as const;

export default screens;
