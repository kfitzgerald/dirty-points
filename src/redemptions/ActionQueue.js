import {RedemptionQueue} from "./RedemptionQueue";
import {convertStringMapping} from "./RewardUtil";
import {saveReplayBuffer, saveScreenshot} from "../obs/OBSActions";
import {getNextQueuedActionReward} from "./RedemptionActions";
import {OBS_SPECIAL_ACTIONS} from "../common/Constants";

export class ActionQueue extends RedemptionQueue {

    constructor(store, options={}) {
        super(store, options);
        this.defaultDebounce = options.defaultDebounce || 30; // TODO make this configurable per-action in the mapping?
        this.concurrent = true; // redemptions can be run in parallel, but will be debounced individually

        // Debounce tracking, so we can track when each action was last executed to prevent spam
        this.actionLastExecuted = {
          // actionType: timestamp
        };
    }

    _getQueueContents() {
        const { getState } = this.redux;
        return getState().redemptions.actionRedemptionQueue;
    }

    async _getNextReward() {
        const { dispatch } = this.redux;
        return await dispatch(getNextQueuedActionReward());
    }

    async _execute(rewardId) {
        const { getState, dispatch } = this.redux;
        const { redemptions } = getState();
        const { mappings } = redemptions;

        // Get the mapping for the reward
        let mapping = mappings[rewardId];
        if (!mapping) {
            // No mapping? no process
            console.info(`ActionQueue: Reward ${rewardId} is not mapped`);
            return false;
        }

        // Convert old mappings if still around
        if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

        // Pull vars out so if the mapping is changed mid-process it won't cause any issues
        const { actions } = mapping;

        // Show filters for each source
        const safeActions = [].concat(actions);
        for (let action of safeActions) {

            // debounce check
            const now = Date.now();
            const lastExecuted = this.actionLastExecuted[action] || 0;
            if (now - lastExecuted < (this.defaultDebounce * 1000)) {
                console.info(`ActionQueue: Action ${action} is being debounced (last executed ${(now - lastExecuted)/1000 }s ago)`);
                continue;
            }

            switch (action) {
                case OBS_SPECIAL_ACTIONS.REPLAY_BUFFER:
                    await dispatch(saveReplayBuffer());
                    break;

                case OBS_SPECIAL_ACTIONS.SCREENSHOT:
                    await dispatch(saveScreenshot());
                    break;

                default:
                    console.warn(`ActionQueue: Unrecognized action ${action} for reward ${rewardId}`);
                    break;
            }

            // Mark this action as executed for debounce tracking
            this.actionLastExecuted[action] = now;
        }

        // Done!
        return true;
    }
}