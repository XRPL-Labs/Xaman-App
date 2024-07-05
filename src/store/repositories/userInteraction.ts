import Realm from 'realm';

import { UserInteractionModel } from '@store/models';
import { InteractionTypes, InteractionDetails } from '@store/models/objects/userInteraction';

import BaseRepository from './base';

/* Repository  ==================================================================== */
class UserInteractionRepository extends BaseRepository<UserInteractionModel> {
    initialize(realm: Realm) {
        this.realm = realm;
        this.model = UserInteractionModel;
    }

    updateInteraction = <T extends InteractionTypes>(type: T, details: Partial<InteractionDetails[T]>): void => {
        // let's find interaction by looking on the type
        const interaction = this.findOne({ type });

        if (interaction) {
            this.safeWrite(() => {
                interaction.details.set(details);
            });
        } else {
            this.create({
                id: new Realm.BSON.ObjectId(),
                type,
                details,
            });
        }
    };

    getInteractionValue = <T extends InteractionTypes>(type: T, key: keyof InteractionDetails[T]) => {
        const interaction = this.findOne({ type });

        if (
            typeof interaction?.details !== 'undefined' &&
            Object.prototype.hasOwnProperty.call(interaction.details, key)
        ) {
            return interaction.details[key];
        }

        return undefined;
    };
}

export default new UserInteractionRepository();
