import Onboarding from './Onboarding';
// setup
import PasscodeSetup from './Setup/Passcode';
import BiometrySetup from './Setup/Biometry';
import PermissionsSetup from './Setup/Permissions';
import DisclaimersSetup from './Setup/Disclaimers';
import FinishSetup from './Setup/Finish';

// TabBar
import Home from './Home';
import Events from './Events';
import Profile from './Profile';
import Settings from './Settings';

// Account
import AccountAdd from './Account/Add';
import AccountImport from './Account/Add/Import';
import AccountGenerate from './Account/Add/Generate';
import AccountList from './Account/List';
import AccountEdit from './Account/Edit';
import AccountChangePassphrase from './Account/Edit/ChangePassphrase';
import AccountChangeTangemSecurity from './Account/Edit/ChangeTangemSecurity';

// Modals
import ReviewTransaction from './Modal/ReviewTransaction';
import Scan from './Modal/Scan';
import Submit from './Modal/Submit';
import FilterEvents from './Modal/FilterEvents';
import Picker from './Modal/Picker';
import Help from './Modal/Help';
import XAppBrowser from './Modal/XAppBrowser';
import CurrencyPicker from './Modal/CurrencyPicker';

// Overlay
import SwitchAccount from './Overlay/SwitchAccount';
import ShareAccount from './Overlay/ShareAccount';
import AddCurrency from './Overlay/AddCurrency';
import Vault from './Overlay/Vault';
import Auth from './Overlay/Authenticate';
import Lock from './Overlay/Lock';
import CurrencySettings from './Overlay/CurrencySettings';
import Alert from './Overlay/Alert';
import RequestDecline from './Overlay/RequestDecline';
import EnterDestinationTag from './Overlay/EnterDestinationTag';
import ExplainBalance from './Overlay/ExplainBalance';
import ChangeLog from './Overlay/ChangeLog';
import ConnectionIssue from './Overlay/ConnectionIssue';
import RecipientMenu from './Overlay/RecipientMenu';
import ConfirmDestinationTag from './Overlay/ConfirmDestinationTag';
import SelectAccount from './Overlay/SelectAccount';
import HomeActions from './Overlay/HomeActions';

// Transaction
import Send from './Send';
import Exchange from './Exchange';
import TransactionDetails from './Events/Details';

// addressBook
import AddressBook from './Settings/AddressBook';
import AddContact from './Settings/AddressBook/Add';
import EditContact from './Settings/AddressBook/Edit';

// node
import NodeList from './Settings/Advanced/Node';

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

// placeholder
import Placeholder from './Placeholder';

export {
    // onboarding
    Onboarding,
    // Setup
    PasscodeSetup,
    BiometrySetup,
    PermissionsSetup,
    DisclaimersSetup,
    FinishSetup,
    // Tab bar
    Home,
    Events,
    Profile,
    Settings,
    // Account
    AccountAdd,
    AccountList,
    AccountEdit,
    AccountChangePassphrase,
    AccountChangeTangemSecurity,
    AccountImport,
    AccountGenerate,
    // Modals
    ReviewTransaction,
    Scan,
    Submit,
    FilterEvents,
    Picker,
    Help,
    XAppBrowser,
    CurrencyPicker,
    // overlay
    SwitchAccount,
    ShareAccount,
    AddCurrency,
    Vault,
    Auth,
    Lock,
    CurrencySettings,
    Alert,
    RequestDecline,
    EnterDestinationTag,
    ExplainBalance,
    ChangeLog,
    ConnectionIssue,
    RecipientMenu,
    ConfirmDestinationTag,
    SelectAccount,
    HomeActions,
    // transaction
    Send,
    Exchange,
    TransactionDetails,
    // addressBook
    AddressBook,
    AddContact,
    EditContact,
    // settings
    GeneralSettings,
    AdvancedSettings,
    SecuritySettings,
    TermOfUse,
    Credits,
    //
    ChangePasscode,
    // nodes
    NodeList,
    // session logs
    SessionLog,
    Placeholder,
};
