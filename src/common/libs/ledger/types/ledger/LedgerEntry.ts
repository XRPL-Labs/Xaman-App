import AccountRoot from './AccountRoot';
import Amendments from './Amendments';
import AMM from './AMM';
import Check from './Check';
import DepositPreauth from './DepositPreauth';
import DirectoryNode from './DirectoryNode';
import Escrow from './Escrow';
import FeeSettings from './FeeSettings';
import LedgerHashes from './LedgerHashes';
import NegativeUNL from './NegativeUNL';
import Offer from './Offer';
import PayChannel from './PayChannel';
import RippleState from './RippleState';
import SignerList from './SignerList';
import Ticket from './Ticket';
import NFTokenOffer from './NFTokenOffer';
import URIToken from './URIToken';
import Delegate from './Delegate';
import Credential from './Credential';
import MPToken from './MPToken';
import MPTokenIssuance from './MPTokenIssuance';
import PermissionedDomain from './PermissionedDomain';
import Cron from './Cron';
import Vault from './Vault';
import LoanBroker from './LoanBroker';
import Loan from './Loan';

type LedgerEntry =
    | AccountRoot
    | Amendments
    | AMM
    | Check
    | DepositPreauth
    | DirectoryNode
    | Escrow
    | FeeSettings
    | LedgerHashes
    | NegativeUNL
    | Offer
    | PayChannel
    | RippleState
    | SignerList
    | Ticket
    | NFTokenOffer
    | URIToken
    | Delegate
    | Credential
    | MPTokenIssuance
    | PermissionedDomain
    | Cron
    | Vault
    | LoanBroker
    | Loan
    | MPToken;

type LedgerEntryFilter =
    | 'account'
    | 'amendments'
    | 'amm'
    | 'check'
    | 'deposit_preauth'
    | 'did'
    | 'directory'
    | 'escrow'
    | 'fee'
    | 'hashes'
    | 'nft_offer'
    | 'nft_page'
    | 'offer'
    | 'payment_channel'
    | 'signer_list'
    | 'state'
    | 'ticket'
    | 'uri_token'
    | 'delegate'
    | 'mptoken'
    | 'mptoken_issuance'
    | 'permissioned_domain'
    | 'cron'
    | 'vault'
    | 'loan_broker'
    | 'loan'
    | 'credential';

export type { LedgerEntry, LedgerEntryFilter };
