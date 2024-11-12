import { AccountModel } from '@store/models';

import { Account, AmountType, OperationActions } from '@common/libs/ledger/parser/types';
import { BalanceChanges } from '@common/libs/ledger/mixin/types';

/**
 * This type represents participants in a process, with optional stages defining their roles.
 *
 * @typedef {Object} Participants
 *
 * @property {Account} [start] - Represents the initial participant or state.
 * @property {Account} [through] - Represents the intermediary participant or transitional state.
 * @property {Account} [end] - Represents the final participant or ending state.
 */
export type Participants = {
    start?: Account;
    through?: Account;
    end?: Account;
};

/**
 * Represents the monetary status of a transaction.
 * @enum {string}
 */
export enum MonetaryStatus {
    IMMEDIATE_EFFECT = 'IMMEDIATE_EFFECT',
    POTENTIAL_EFFECT = 'POTENTIAL_EFFECT',
    NO_EFFECT = 'NO_EFFECT',
}

/**
 * Represents the types of assets.
 * @enum {string}
 */
export enum AssetTypes {
    NFToken = 'NFToken',
    URIToken = 'URIToken',
}

/**
 * Represents a monetary factor type.
 * @typedef {Object} MonetaryFactorType
 * @property {AmountType} amount - The amount of the monetary factor.
 * @property {MonetaryStatus} effect - The effect of the monetary factor.
 * @property {OperationActions} [action] - The action associated with the monetary factor (optional).
 */
export type MonetaryFactorType = AmountType & {
    effect: MonetaryStatus;
    action?: OperationActions;
};

/**
 * Represents the monetary details for a given transaction.
 * @typedef {Object} MonetaryDetails
 * @property {BalanceChanges} mutate - The balance changes for the transaction.
 * @property {MonetaryFactorType[]} [factor] - The monetary factors associated with the transaction.
 */
export type MonetaryDetails =
    | {
          mutate: BalanceChanges;
          factor?: MonetaryFactorType[];
      }
    | undefined;

/**
 * Represents the details of an asset.
 * @typedef {Object} AssetDetails
 * @property {AssetTypes} type - The type of the asset.
 * @property {string} nfTokenId - The ID of the NFToken. This property is only present if the asset type is NFToken.
 * @property {string} uriTokenId - The ID of the URI token. This property is only present if the asset type is URIToken.
 */
export type AssetDetails =
    | {
          type: AssetTypes.NFToken;
          nfTokenId: string;
      }
    | {
          type: AssetTypes.URIToken;
          uriTokenId: string;
          owner: string;
      };

/**
 * An abstract class representing a transaction explainer.
 *
 * @template T - The type of the item, transaction.
 * @template M - The type of the mixing.
 */
export abstract class ExplainerAbstract<T, M = unknown> {
    protected item: T & M;
    protected account: AccountModel;

    protected constructor(item: T & M, account: AccountModel) {
        this.item = item;
        this.account = account;
    }

    /**
     * Retrieves the label for events list.
     *
     * @returns {string} The label for events.
     */
    abstract getEventsLabel(): string;

    /**
     * Generates a human-readable description about transaction.
     *
     * @returns {string} The generated description.
     */
    abstract generateDescription(): string;
    /**
     * Retrieves the participants information for a transaction.
     *
     * @returns {Object} - An object that contains the start, through, and end accounts
     *                    involved in the transaction.
     *                    - start: {Account} The account from which the transaction starts
     *                    - through: {Account} The account through which the transaction passes
     *                    - end: {Account} The account where the transaction ends
     */
    abstract getParticipants(): Participants;
    /**
     * Retrieves the monetary details.
     *
     * @returns {MonetaryDetails} The monetary details about transaction.
     */
    abstract getMonetaryDetails(): MonetaryDetails;
    /**
     * Retrieves the details of mutated assets in this transaction.
     *
     * @returns {AssetDetails[]} - An array of AssetDetails objects representing the details of the mutated assets.
     */
    getAssetDetails(): AssetDetails[] {
        return [];
    }
}

/**
 * Represents a validation type function.
 * @template T - The type of item being validated (transaction).
 * @param item - The item to be validated.
 * @param account - Optional parameter representing the account model being represented.
 * @returns A Promise that resolves if the validation is successful, otherwise rejects with an error.
 */
export type ValidationType<T> = (item: T, account?: AccountModel) => Promise<void>;
