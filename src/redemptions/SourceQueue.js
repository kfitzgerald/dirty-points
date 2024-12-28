import {RedemptionQueue} from "./RedemptionQueue";
import {convertStringMapping} from "./RewardUtil";
import {setSceneItemEnabled} from "../obs/OBSActions";
import {getNextQueuedSourceReward} from "./RedemptionActions";

export class SourceQueue extends RedemptionQueue {

    constructor(store, options={}) {
        super(store, options);
        this.defaultHideTimeout = options.defaultHideTimeout || 10;
        this.concurrent = true; // show/hide redeems can be run in parallel
    }

    _getQueueContents() {
        const { getState } = this.redux;
        return getState().redemptions.sourceRedemptionQueue;
    }

    async _getNextReward() {
        const { dispatch } = this.redux;
        return await dispatch(getNextQueuedSourceReward());
    }

    async _execute(rewardId) {
        const { getState, dispatch } = this.redux;
        const {redemptions} = getState();
        const {mappings} = redemptions;

        // Get the mapping for the reward
        let mapping = mappings[rewardId];
        if (!mapping) {
            // No mapping? no process
            console.info(`SourceQueue: Reward ${rewardId} is not mapped`);
            return false;
        }

        // Convert old mappings if still around
        if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

        // Pull vars out so if the mapping is changed mid-process it won't cause any issues
        const { sceneName, timeout, sceneItems, secondaryItems } = mapping;

        // Show all configured sources on scene
        const sourceItemIds = [].concat(sceneItems);
        for (let sourceItemId of sourceItemIds) {
            await dispatch(setSceneItemEnabled(sceneName, sourceItemId, true));
        }

        // Show all secondary sources, if configured
        const auxItems = [].concat(secondaryItems || []);
        for (let secondaryItem of auxItems) {
            for (let sourceItemId of secondaryItem.sceneItems) {
                await dispatch(setSceneItemEnabled(secondaryItem.sceneName, sourceItemId, true));
            }
        }

        // Only disable sources if timeout is set
        if (timeout > 0) {

            // Wait for the timeout
            await this._cooldown((timeout || this.defaultHideTimeout) * 1000);

            // Hide each selected source from scene
            for (let sourceItemId of sourceItemIds) {
                await dispatch(setSceneItemEnabled(sceneName, sourceItemId, false));
            }

            // Hide secondary sources too
            for (let secondaryItem of auxItems) {
                for (let sourceItemId of secondaryItem.sceneItems) {
                    await dispatch(setSceneItemEnabled(secondaryItem.sceneName, sourceItemId, false));
                }
            }
        }

        // Done!
        return true;
    }
}