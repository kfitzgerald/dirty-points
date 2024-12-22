import {ApiClient} from '@twurple/api';
import {EventSubWsListener} from '@twurple/eventsub-ws';
import { StaticAuthProvider } from '@twurple/auth';
import {apiDelete, apiGet, apiPatch, apiPost, CLIENT_ID} from "../common/API";
import {getMappingType} from "./RewardUtil";
import {MAPPING_TYPES} from "../common/Constants";

//region Twitch WebSocket Actions

/**
 * @type {EventSubWsListener}
 */
let twitchSocket;

export const TWITCH_CONNECTION_STATUS = {
    connected: 'connected',
    connecting: 'connecting',
    disconnected: 'disconnected',
};

export const UPDATE_TWITCH_CONNECTION_STATE = 'UPDATE_TWITCH_CONNECTION_STATE';
export function updateTwitchConnectionState(status, error) {
    return {
        type: UPDATE_TWITCH_CONNECTION_STATE,
        status,
        error
    };
}

export const UPDATE_TWITCH_ERROR = 'UPDATE_TWITCH_ERROR';
export function updateTwitchError(error) {
    return {
        type: UPDATE_TWITCH_ERROR,
        error
    };
}

export function connectToTwitch() {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {status, /*mappings*/} = redemptions;
        const broadcaster_user_id = session.data.user_id;
        const access_token = session.token.access_token;

        // no double connects
        if (status !== TWITCH_CONNECTION_STATUS.disconnected) return;
        dispatch(updateTwitchConnectionState(TWITCH_CONNECTION_STATUS.connecting, null));

        const authProvider = new StaticAuthProvider(CLIENT_ID, access_token);
        const apiClient = new ApiClient({ authProvider });
        twitchSocket = new EventSubWsListener({
            apiClient,
        });

        twitchSocket.onUserSocketConnect(() => {
            console.log('twitch socket connected');
            dispatch(updateTwitchConnectionState(TWITCH_CONNECTION_STATUS.connected, null));
        });

        twitchSocket.onUserSocketDisconnect(() => {
            console.log('twitch socket disconnected');
            dispatch(updateTwitchConnectionState(TWITCH_CONNECTION_STATUS.disconnected, null));
        });

        twitchSocket.onChannelRedemptionAdd(broadcaster_user_id, event => {
            console.log('thing happened', event.rewardId, event.rewardTitle);
            dispatch(executeReward(event.rewardId));
        });

        twitchSocket.onChannelChatMessage(broadcaster_user_id, broadcaster_user_id, event => {
            const {chatMappings, rewards, manageableRewards } = getState().redemptions;
            const message = event.messageText.trim().toLowerCase();
            console.log('chat message', { event, message, chatMappings, badges: Object.keys(event.badges) } );
            chatMappings
                .filter(([rewardId, mapping]) => {
                    const reward = manageableRewards.find(r => r.id === rewardId) || rewards.find(r => r.id === rewardId);
                    return reward && reward.is_enabled && message.startsWith(mapping.chatCommand);
                })
                .forEach(([rewardId, mapping]) => {
                    let allowed = true;
                    if (mapping.chatCommandBadges?.length > 0) {
                        // limit to messages with attached badges
                        const messageBadges = Object.keys(event.badges);
                        const hasRequiredBadge = mapping.chatCommandBadges.find(badgeName => messageBadges.includes(badgeName));
                        allowed = !!hasRequiredBadge;
                    }
                    if (allowed) {
                        dispatch(executeReward(rewardId));
                    } else {
                        console.log('Required badge not present, not executing redemption');
                    }
                })
            ;
        });

        console.log('twitch starting...');
        twitchSocket.start();
    };
}

export function disconnectFromTwitch() {
    return async (dispatch, getState) => {
        const {redemptions} = getState();
        const {status} = redemptions;

        if (status !== TWITCH_CONNECTION_STATUS.connected) return;
        if (!twitchSocket) return;

        twitchSocket.stop();

        let ticks = 50, tick = 1;
        while (tick++ < ticks) {
            if (getState().redemptions.status === TWITCH_CONNECTION_STATUS.disconnected) {
                // done
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    };
}

//endregion

//region Reward handling

// do we need a cooldown var?
// e.g. if last time reward was redeemed was too soon, push it back into the queue

// on scene redeem
// - push into queue
// - tickle the queue processor
//
// on scene process
// - pop item off queue
// - show scene
// - wait for timeout
// - show timeout scene
// - global cooldown (2s or length of scene transition x 2)
// - tickle the queue processor (loop)
//
// on source redeem (parallel queue, bypass queue?)
// - push into queue
// - tickle the queue processor
//
// on source process
// - pop item off queue
// - show source(s)
// - wait for timeout
// - hide source(s)
// - global cooldown (2s or length of scene transition)
// - tickle the queue processor (loop)


export const ENQUEUE_SCENE_REWARD = 'ENQUEUE_SCENE_REWARD';
export function enqueueSceneReward(rewardId) {
    return {
        type: ENQUEUE_SCENE_REWARD,
        rewardId
    };
}

export const ENQUEUE_SOURCE_REWARD = 'ENQUEUE_SOURCE_REWARD';
export function enqueueSourceReward(rewardId) {
    return {
        type: ENQUEUE_SOURCE_REWARD,
        rewardId
    };
}

export const ENQUEUE_FILTER_REWARD = 'ENQUEUE_FILTER_REWARD';
export function enqueueFilterReward(rewardId) {
    return {
        type: ENQUEUE_FILTER_REWARD,
        rewardId
    };
}

export const DEQUEUE_SCENE_REWARD = 'DEQUEUE_SCENE_REWARD';
export function dequeueSceneReward(rewardId) {
    return {
        type: DEQUEUE_SCENE_REWARD,
        rewardId
    };
}

export const DEQUEUE_SOURCE_REWARD = 'DEQUEUE_SOURCE_REWARD';
export function dequeueSourceReward(rewardId) {
    return {
        type: DEQUEUE_SOURCE_REWARD,
        rewardId
    };
}

export const DEQUEUE_FILTER_REWARD = 'DEQUEUE_FILTER_REWARD';
export function dequeueFilterReward(rewardId) {
    return {
        type: DEQUEUE_FILTER_REWARD,
        rewardId
    };
}

export function getNextQueuedSceneReward() {
    return async (dispatch, getState) => {
        const {redemptions} = getState();
        const { sceneRedemptionQueue } = redemptions;
        const task = sceneRedemptionQueue[0];

        // Update state
        if (task) await dispatch(dequeueSceneReward(task));

        // Return the task
        return task;
    }
}

export function getNextQueuedSourceReward() {
    return async (dispatch, getState) => {
        const {redemptions} = getState();
        const { sourceRedemptionQueue } = redemptions;
        const task = sourceRedemptionQueue[0];

        // Update state
        if (task) await dispatch(dequeueSourceReward(task));

        // Return the task
        return task;
    }
}

export function getNextQueuedFilterReward() {
    return async (dispatch, getState) => {
        const {redemptions} = getState();
        const { filterRedemptionQueue } = redemptions;
        const task = filterRedemptionQueue[0];

        // Update state
        if (task) await dispatch(dequeueFilterReward(task));

        // Return the task
        return task;
    }
}

export function executeReward(rewardId) {
    return async (dispatch, getState) => {
        const {redemptions} = getState();
        const {mappings} = redemptions;

        let mapping = mappings[rewardId];
        if (!mapping) {
            console.info(`executeReward: Reward ${rewardId} is not mapped`);
            return;
        }

        switch (getMappingType(mapping)) {
            case MAPPING_TYPES.FILTER_TOGGLE: return await dispatch(enqueueFilterReward(rewardId));
            case MAPPING_TYPES.SCENE_CHANGE:  return await dispatch(enqueueSceneReward(rewardId));
            case MAPPING_TYPES.SOURCE_TOGGLE: return await dispatch(enqueueSourceReward(rewardId));
            default:
                console.warn('executeReward: Invalid mapping - dunno how to handle', mapping);
        }

    };
}

//endregion

//region Fetch Redemptions

export const REQUEST_REDEMPTION_LIST = 'REQUEST_REDEMPTION_LIST';
export function requestRedemptionList(manageable) {
    return {
        type: REQUEST_REDEMPTION_LIST,
        manageable
    };
}

export const RECEIVE_REDEMPTION_LIST_SUCCESS = 'RECEIVE_REDEMPTION_LIST_SUCCESS';
export function receiveRedemptionListSuccess(data, manageable) {
    return {
        type: RECEIVE_REDEMPTION_LIST_SUCCESS,
        lastUpdated: Date.now(),
        data,
        manageable
    };
}

export const RECEIVE_REDEMPTION_LIST_ERROR = 'RECEIVE_REDEMPTION_LIST_ERROR';
export function receiveRedemptionListError(error, manageable) {
    return {
        type: RECEIVE_REDEMPTION_LIST_ERROR,
        error,
        manageable
    };
}

export function fetchRedemptionList() {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {isFetchingRewards} = redemptions;
        const { access_token } = session.token;
        const broadcaster_id = session.data.user_id;

        if (isFetchingRewards) return; // no dup requests


        dispatch(requestRedemptionList(false));
        const query = {
            broadcaster_id
        };

        apiGet('https://api.twitch.tv/helix/channel_points/custom_rewards', { query, bearer: access_token})
            .then(body => {
                dispatch(receiveRedemptionListSuccess(body.data, false));
            }, error => {
                dispatch(receiveRedemptionListError(error, false));
            })
        ;

    };
}

export function fetchManageableRedemptionList() {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {isFetchingManageableRewards} = redemptions;
        const { access_token } = session.token;
        const broadcaster_id = session.data.user_id;

        if (isFetchingManageableRewards) return; // no dup requests


        dispatch(requestRedemptionList(true));
        const query = {
            broadcaster_id,
            only_manageable_rewards: true
        };

        apiGet('https://api.twitch.tv/helix/channel_points/custom_rewards', { query, bearer: access_token})
            .then(body => {
                dispatch(receiveRedemptionListSuccess(body.data, true));
            }, error => {
                dispatch(receiveRedemptionListError(error, true));
            })
        ;

    };
}

//endregion

//region Set OBS-Twitch mapping

export const SET_REDEMPTION_MAPPING = 'SET_REDEMPTION_MAPPING';
export function setRedemptionMapping(rewardId, mapping) {
    return {
        type: SET_REDEMPTION_MAPPING,
        mapping,
        rewardId
    };
}

export const DELETE_REDEMPTION_MAPPING = 'DELETE_REDEMPTION_MAPPING';
export function deleteRedemptionMapping(rewardId) {
    return {
        type: DELETE_REDEMPTION_MAPPING,
        rewardId
    };
}

//endregion

//region Update Reward

export const REQUEST_UPDATE_REWARD = 'REQUEST_UPDATE_REWARD';
export function requestUpdateReward() {
    return {
        type: REQUEST_UPDATE_REWARD
    };
}

export const RECEIVE_UPDATE_REWARD_SUCCESS = 'RECEIVE_UPDATE_REWARD_SUCCESS';
export function receiveUpdateRewardSuccess(data, id, payload) {
    return {
        type: RECEIVE_UPDATE_REWARD_SUCCESS,
        lastUpdated: Date.now(),
        data,
        id,
        payload
    };
}

export const RECEIVE_UPDATE_REWARD_ERROR = 'RECEIVE_UPDATE_REWARD_ERROR';
export function receiveUpdateRewardError(error) {
    return {
        type: RECEIVE_UPDATE_REWARD_ERROR,
        error
    };
}

export const CLEAR_CREATE_UPDATE_ERRORS = 'CLEAR_CREATE_UPDATE_ERRORS';
export function clearCreateUpdateErrors() {
    return {
        type: CLEAR_CREATE_UPDATE_ERRORS,
    };
}

export function updateReward(id, payload) {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {isUpdating} = redemptions;
        const { access_token } = session.token;
        const broadcaster_id = session.data.user_id;

        if (isUpdating) return; // no dup requests

        dispatch(requestUpdateReward());
        const query = {
            broadcaster_id,
            id
        };

        return apiPatch('https://api.twitch.tv/helix/channel_points/custom_rewards', { query, payload, bearer: access_token })
            .then(body => {
                dispatch(receiveUpdateRewardSuccess(body.data[0], id, payload));
                return body.data[0];
            }, error => {
                dispatch(receiveUpdateRewardError(error));
            })
        ;

    };
}

//endregion

//region Create Reward

export const REQUEST_CREATE_REWARD = 'REQUEST_CREATE_REWARD';
export function requestCreateReward() {
    return {
        type: REQUEST_CREATE_REWARD
    };
}

export const RECEIVE_CREATE_REWARD_SUCCESS = 'RECEIVE_CREATE_REWARD_SUCCESS';
export function receiveCreateRewardSuccess(data) {
    return {
        type: RECEIVE_CREATE_REWARD_SUCCESS,
        lastUpdated: Date.now(),
        data
    };
}

export const RECEIVE_CREATE_REWARD_ERROR = 'RECEIVE_CREATE_REWARD_ERROR';
export function receiveCreateRewardError(error) {
    return {
        type: RECEIVE_CREATE_REWARD_ERROR,
        error
    };
}

export function createReward(payload) {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {isCreating} = redemptions;
        const { access_token } = session.token;
        const broadcaster_id = session.data.user_id;

        if (isCreating) return; // no dup requests

        dispatch(requestCreateReward());
        const query = {
            broadcaster_id,
        };

        return apiPost('https://api.twitch.tv/helix/channel_points/custom_rewards', { query, payload, bearer: access_token })
            .then(body => {
                dispatch(receiveCreateRewardSuccess(body.data[0]));
                return body.data[0];
            }, error => {
                dispatch(receiveCreateRewardError(error));
                return null;
            })
        ;

    };
}

//endregion

//region Delete Reward

export const REQUEST_DELETE_REWARD = 'REQUEST_DELETE_REWARD';
export function requestDeleteReward() {
    return {
        type: REQUEST_DELETE_REWARD
    };
}

export const RECEIVE_DELETE_REWARD_SUCCESS = 'RECEIVE_DELETE_REWARD_SUCCESS';
export function receiveDeleteRewardSuccess(data, id) {
    return {
        type: RECEIVE_DELETE_REWARD_SUCCESS,
        lastUpdated: Date.now(),
        data,
        id
    };
}

export const RECEIVE_DELETE_REWARD_ERROR = 'RECEIVE_DELETE_REWARD_ERROR';
export function receiveDeleteRewardError(error) {
    return {
        type: RECEIVE_DELETE_REWARD_ERROR,
        error
    };
}

export function deleteReward(id) {
    return async (dispatch, getState) => {
        const {redemptions, session} = getState();
        const {isDeleting} = redemptions;
        const { access_token } = session.token;
        const broadcaster_id = session.data.user_id;

        if (isDeleting) return; // no dup requests

        dispatch(requestDeleteReward());
        const query = {
            broadcaster_id,
            id
        };

        return apiDelete('https://api.twitch.tv/helix/channel_points/custom_rewards', { query, bearer: access_token })
            .then(body => {
                dispatch(receiveDeleteRewardSuccess(body.data, id));
                return true;
            }, error => {
                dispatch(receiveDeleteRewardError(error));
                return false;
            })
        ;

    };
}

//endregion