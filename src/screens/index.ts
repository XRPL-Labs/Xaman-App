import Onboarding from './Onboarding';
// setup
import PasscodeSetup from './Setup/Passcode';
import BiometrySetup from './Setup/Biometry';
import PushNotificationSetup from './Setup/PushNotification';
import DisclaimersSetup from './Setup/Disclaimers';
import FinishSetup from './Setup/Finish';

// TabBar
import Home from './Home';
import Events from './Events';
import XApps from './xApps';
import Settings from './Settings';

// Account
import AccountAdd from './Account/Add';
import AccountImport from './Account/Add/Import';
import AccountGenerate from './Account/Add/Generate';
import AccountList from './Account/List';
import AccountEdit from './Account/Edit';
import AccountChangePassphrase from './Account/Edit/ChangePassphrase';
import AccountChangeTangemSecurity from './Account/Edit/ChangeTangemSecurity';
import AccountCipherMigrationView from './Account/Migration/CipherMigration';

// Modals
import ReviewTransaction from './Modal/ReviewTransaction';
import Scan from './Modal/Scan';
import Submit from './Modal/Submit';
import FilterEvents from './Modal/FilterEvents';
import Help from './Modal/Help';
import MigrationExplain from './Modal/MigrationExplain';
import XAppBrowser from './Modal/XAppBrowser';
import CurrencyPicker from './Modal/CurrencyPicker';
import DestinationPicker from './Modal/DestinationPicker';
import TransactionLoader from './Modal/TransactionLoader';

// Overlay
import SwitchAccount from './Overlay/SwitchAccount';
import ShareAccount from './Overlay/ShareAccount';
import AddToken from './Overlay/AddToken';
import Vault from './Overlay/Vault';
import Auth from './Overlay/Authenticate';
import Lock from './Overlay/Lock';
import TokenSettings from './Overlay/TokenSettings';
import Alert from './Overlay/Alert';
import CriticalProcessing from './Overlay/CriticalProcessing';
import FlaggedDestination from './Overlay/FlaggedDestination';
import RequestDecline from './Overlay/RequestDecline';
import EnterDestinationTag from './Overlay/EnterDestinationTag';
import ExplainBalance from './Overlay/ExplainBalance';
import ChangeLog from './Overlay/ChangeLog';
import ConnectionIssue from './Overlay/ConnectionIssue';
import ParticipantMenu from './Overlay/ParticipantMenu';
import ConfirmDestinationTag from './Overlay/ConfirmDestinationTag';
import SelectAccount from './Overlay/SelectAccount';
import SelectCurrency from './Overlay/SelectCurrency';
import SelectFee from './Overlay/SelectFee';
import HomeActions from './Overlay/HomeActions';
import PassphraseAuthentication from './Overlay/PassphraseAuthentication';
import SwitchAssetCategory from './Overlay/SwitchAssetCategory';
import SwitchNetwork from './Overlay/SwitchNetwork';
import XAppInfo from './Overlay/XAppInfo';
import NetworkRailsSync from './Overlay/NetworkRailsSync';
import PurchaseProduct from './Overlay/PurchaseProduct';

// Transaction
import Send from './Send';
import Request from './Request';
import Exchange from './Exchange';
import TransactionDetails from './Events/Details';

// addressBook
import AddressBook from './Settings/AddressBook';
import AddContact from './Settings/AddressBook/Add';
import EditContact from './Settings/AddressBook/Edit';

// network
import NetworkList from './Settings/Advanced/Network';

// third party apps
import ThirdPartyAppsList from './Settings/ThirdPartyApps';
import EditThirdPartyApp from './Settings/ThirdPartyApps/Edit';

// settings
import GeneralSettings from './Settings/General';
import AdvancedSettings from './Settings/Advanced';
import SecuritySettings from './Settings/Security';
import TermOfUse from './Settings/TermOfUse';
import Credits from './Settings/Credits';

// security settings
import ChangePasscode from './Settings/Security/ChangePasscode';

// session log
import SessionLog from './Settings/Advanced/Logs';

// global screens
import Placeholder from './Global/Placeholder';
import Picker from './Global/Picker';

export {
    Onboarding,
    PasscodeSetup,
    BiometrySetup,
    PushNotificationSetup,
    DisclaimersSetup,
    FinishSetup,
    Home,
    Events,
    XApps,
    Settings,
    AccountAdd,
    AccountList,
    AccountEdit,
    AccountChangePassphrase,
    AccountChangeTangemSecurity,
    AccountImport,
    AccountGenerate,
    AccountCipherMigrationView,
    ReviewTransaction,
    Scan,
    Submit,
    FilterEvents,
    Help,
    MigrationExplain,
    XAppBrowser,
    CurrencyPicker,
    DestinationPicker,
    TransactionLoader,
    SwitchAccount,
    ShareAccount,
    AddToken,
    TokenSettings,
    Vault,
    Auth,
    Lock,
    Alert,
    CriticalProcessing,
    FlaggedDestination,
    RequestDecline,
    EnterDestinationTag,
    ExplainBalance,
    ChangeLog,
    ConnectionIssue,
    ParticipantMenu,
    ConfirmDestinationTag,
    SelectAccount,
    SelectCurrency,
    SelectFee,
    HomeActions,
    PassphraseAuthentication,
    SwitchAssetCategory,
    SwitchNetwork,
    XAppInfo,
    NetworkRailsSync,
    PurchaseProduct,
    Send,
    Request,
    Exchange,
    TransactionDetails,
    AddressBook,
    AddContact,
    EditContact,
    GeneralSettings,
    AdvancedSettings,
    SecuritySettings,
    TermOfUse,
    Credits,
    ChangePasscode,
    ThirdPartyAppsList,
    EditThirdPartyApp,
    NetworkList,
    SessionLog,
    Picker,
    Placeholder,
};
