import {RedemptionQueue} from "./RedemptionQueue";
import {convertStringMapping} from "./RewardUtil";
import {setSourceFilterEnabled} from "../obs/OBSActions";
import {getNextQueuedFilterReward} from "./RedemptionActions";

export class FilterQueue extends RedemptionQueue {

    constructor(store, options={}) {
        super(store, options);
        this.defaultHideTimeout = options.defaultHideTimeout || 10;
        this.concurrent = true; // show/hide redeems can be run in parallel
    }

    _getQueueContents() {
        const { getState } = this.redux;
        return getState().redemptions.filterRedemptionQueue;
    }

    async _getNextReward() {
        const { dispatch } = this.redux;
        return await dispatch(getNextQueuedFilterReward());
    }

    async _execute(rewardId) {
        const { getState, dispatch } = this.redux;
        const { redemptions } = getState();
        const { mappings } = redemptions;

        // Get the mapping for the reward
        let mapping = mappings[rewardId];
        if (!mapping) {
            // No mapping? no process
            console.info(`FilterQueue: Reward ${rewardId} is not mapped`);
            return false;
        }

        // Convert old mappings if still around
        if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

        // Pull vars out so if the mapping is changed mid-process it won't cause any issues
        const { timeout, sourceFilters } = mapping;

        // Show filters for each source
        const safeFilters = [].concat(sourceFilters);
        for (let sourceFilter of safeFilters) {
            for (let filterName of sourceFilter.filterNames) {
                await dispatch(setSourceFilterEnabled(sourceFilter.sourceName, filterName, true));
            }
        }

        // If no timeout, leave in the enabled state
        if (timeout > 0) {

            // Wait for the timeout
            await this._cooldown((timeout || this.defaultHideTimeout) * 1000);

            // Hide filters for each source
            for (let sourceFilter of safeFilters) {
                for (let filterName of sourceFilter.filterNames) {
                    await dispatch(setSourceFilterEnabled(sourceFilter.sourceName, filterName, false));
                }
            }
        }

        // Done!
        return true;
    }
}