import { Offer, Escrow, Check, Ticket, PayChannel, NFTokenOffer, URIToken, Delegate, Credential } from '.';

export type LedgerObjects =
    | Offer
    | Escrow
    | Check
    | Ticket
    | PayChannel
    | NFTokenOffer
    | URIToken
    | Delegate
    | Credential;
