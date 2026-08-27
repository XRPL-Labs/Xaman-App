import {
    Offer,
    Escrow,
    Check,
    Cron,
    Ticket,
    PayChannel,
    NFTokenOffer,
    URIToken,
    Delegate,
    Credential,
    MPToken,
    PermissionedDomain,
    MPTokenIssuance,
    DepositPreauth,
    Vault,
    LoanBroker,
    Loan,
} from '.';

export type LedgerObjects =
    | Offer
    | Escrow
    | Check
    | Ticket
    | Cron
    | PayChannel
    | NFTokenOffer
    | URIToken
    | Delegate
    | Credential
    | MPToken
    | PermissionedDomain
    | DepositPreauth
    | Vault
    | LoanBroker
    | Loan
    | MPTokenIssuance;
