import {
    CLEAR_CREATE_UPDATE_ERRORS,
    DELETE_REDEMPTION_MAPPING,
    DEQUEUE_FILTER_REWARD,
    DEQUEUE_SCENE_REWARD,
    DEQUEUE_SOURCE_REWARD,
    ENQUEUE_FILTER_REWARD,
    ENQUEUE_SCENE_REWARD,
    ENQUEUE_SOURCE_REWARD,
    RECEIVE_CREATE_REWARD_ERROR,
    RECEIVE_CREATE_REWARD_SUCCESS,
    RECEIVE_DELETE_REWARD_ERROR,
    RECEIVE_DELETE_REWARD_SUCCESS,
    RECEIVE_REDEMPTION_LIST_ERROR,
    RECEIVE_REDEMPTION_LIST_SUCCESS,
    RECEIVE_UPDATE_REWARD_ERROR,
    RECEIVE_UPDATE_REWARD_SUCCESS,
    REQUEST_CREATE_REWARD,
    REQUEST_DELETE_REWARD,
    REQUEST_REDEMPTION_LIST,
    REQUEST_UPDATE_REWARD,
    SET_REDEMPTION_MAPPING,
    TWITCH_CONNECTION_STATUS,
    UPDATE_TWITCH_CONNECTION_STATE,
    UPDATE_TWITCH_ERROR
} from "./RedemptionActions";
import {IMPORT_SETTINGS} from "../app/AppActions";
import {OBS_SCENE_ITEM_REMOVED, OBS_SCENE_NAME_CHANGED} from "../obs/OBSActions";

export const initialState = {

    // socket state
    status: TWITCH_CONNECTION_STATUS.disconnected,

    // twitch api state
    isFetchingRewards: false,
    isFetchingManageableRewards: false,
    isUpdating: false,
    isDeleting: false,


    lastError: null,
    lastUpdateError: null,
    lastCreateError: null,

    didInvalidate: false,
    lastUpdated: null,

    rewards: [],            // all channel rewards (even ones that are not manageable
    manageableRewards: [],  // only rewards that this app has created / can manage

    mappings: {}, // reward id -> obs scene

    // queues for processing redemptions
    sceneRedemptionQueue: [],
    sourceRedemptionQueue: [],
    filterRedemptionQueue: [],

    // shortcut for making chat command inspection easier
    chatMappings: [] // filtered list of chat commands
};

export default function RedemptionReducer(state = initialState, action) {
    switch (action.type) {

        //region Socket state

        case UPDATE_TWITCH_CONNECTION_STATE:
            return {
                ...state,
                status: action.status,
                lastError: action.error
            };

        //endregion

        //region Redemption queues

        case ENQUEUE_SCENE_REWARD:
            return {
                ...state,
                sceneRedemptionQueue: [...state.sceneRedemptionQueue, action.rewardId]
            };

        case ENQUEUE_SOURCE_REWARD:
            return {
                ...state,
                sourceRedemptionQueue: [...state.sourceRedemptionQueue, action.rewardId]
            };

        case ENQUEUE_FILTER_REWARD:
            return {
                ...state,
                filterRedemptionQueue: [...state.filterRedemptionQueue, action.rewardId]
            };

        case DEQUEUE_SCENE_REWARD:
            // option to filter the first action.rewardId out of the queue, but skip for now unless it's a problem
            return {
                ...state,
                sceneRedemptionQueue: state.sceneRedemptionQueue.slice(1) // pop the first item off
            };

        case DEQUEUE_SOURCE_REWARD:
            // option to filter the first action.rewardId out of the queue, but skip for now unless it's a problem
            return {
                ...state,
                sourceRedemptionQueue: state.sourceRedemptionQueue.slice(1) // pop the first item off
            };

        case DEQUEUE_FILTER_REWARD:
            // option to filter the first action.rewardId out of the queue, but skip for now unless it's a problem
            return {
                ...state,
                filterRedemptionQueue: state.filterRedemptionQueue.slice(1) // pop the first item off
            };

        //endregion

        //region Twitch reward list state

        case REQUEST_REDEMPTION_LIST:
            return {
                ...state,
                isFetchingRewards: action.manageable ? state.isFetchingRewards : true,
                isFetchingManageableRewards: action.manageable ? true : state.isFetchingManageableRewards,
            };

        case RECEIVE_REDEMPTION_LIST_SUCCESS:
            return {
                ...state,
                isFetchingRewards: action.manageable ?  state.isFetchingRewards : false,
                isFetchingManageableRewards: action.manageable ? false : state.isFetchingManageableRewards,
                lastError: false,
                didInvalidate: false,
                lastUpdated: action.lastUpdated,
                rewards: action.manageable ? state.rewards : action.data,
                manageableRewards: action.manageable ? action.data : state.manageableRewards
            };

        case UPDATE_TWITCH_ERROR:
        case RECEIVE_REDEMPTION_LIST_ERROR:
            return {
                ...state,
                isFetchingRewards: action.manageable ? state.isFetchingRewards : false,
                isFetchingManageableRewards: action.manageable ? false : state.isFetchingManageableRewards,
                lastError: action.error
            };

        //endregion

        //region Update reward state

        case REQUEST_UPDATE_REWARD:
            return {
                ...state,
                isUpdating: true,
                lastUpdateError: null
            }

        case RECEIVE_UPDATE_REWARD_SUCCESS: {
            return {
                ...state,
                isUpdating: false,
                lastUpdateError: false,
                lastUpdated: action.lastUpdated,
                manageableRewards: state.manageableRewards.map(r => {
                    if (r.id === action.id) {
                        return action.data;
                    } else {
                        return r;
                    }
                })
            };
        }

        case RECEIVE_UPDATE_REWARD_ERROR:
            return {
                ...state,
                isUpdating: false,
                lastUpdateError: action.error
            };

        case CLEAR_CREATE_UPDATE_ERRORS:
            return {
                ...state,
                lastUpdateError: null,
                lastCreateError: null
            };

        //endregion

        //region OBS Mapping state

        case SET_REDEMPTION_MAPPING: {
            const mappings = {
                ...state.mappings,
                [action.rewardId]: action.mapping
            };
            return {
                ...state,
                mappings,
                chatMappings: Object.entries(mappings).filter(e => !!e[1].chatCommand)
            };
        }

        case DELETE_REDEMPTION_MAPPING: {
            const mappings = {
                ...state.mappings,
                [action.rewardId]: undefined
            };
            return {
                ...state,
                mappings,
                chatMappings: Object.entries(mappings).filter(e => !!e[1]?.chatCommand)
            };
        }

        case IMPORT_SETTINGS: {
            return {
                ...state,
                mappings: action.mappings || [],
                chatMappings: Object.entries(action.mappings || []).filter(e => !!e[1].chatCommand)
            };
        }

        //endregion

        //region Create reward state

        case REQUEST_CREATE_REWARD:
            return {
                ...state,
                isCreating: true,
                lastCreateError: null
            };

        case RECEIVE_CREATE_REWARD_SUCCESS: {
            return {
                ...state,
                isCreating: false,
                lastCreateError: false,
                lastUpdated: action.lastUpdated,
                manageableRewards: state.manageableRewards.concat(action.data)
            };
        }

        case RECEIVE_CREATE_REWARD_ERROR:
            return {
                ...state,
                isCreating: false,
                lastCreateError: action.error
            };

        //endregion

        //region Delete reward state

        case REQUEST_DELETE_REWARD:
            return {
                ...state,
                isDeleting: true,
                lastUpdateError: null
            }

        case RECEIVE_DELETE_REWARD_SUCCESS: {
            return {
                ...state,
                isDeleting: false,
                lastUpdateError: false,
                lastUpdated: action.lastUpdated,
                manageableRewards: state.manageableRewards.filter(r => r.id !== action.id)
            };
        }

        case RECEIVE_DELETE_REWARD_ERROR:
            return {
                ...state,
                isDeleting: false,
                lastUpdateError: action.error
            };

        //endregion

        //region OBS Events

        case OBS_SCENE_NAME_CHANGED: {

            // Update any old scene name references in the mappings
            const mappings = Object.fromEntries(Object.entries(state.mappings)
                .map(([key, value]) => {
                    const secondaryItems = (value.secondaryItems || []).map(item => {
                        return {
                            ...item,
                            sceneName: (item.sceneName === action.oldSceneName) ? action.sceneName : item.sceneName,
                        }
                    });
                    return [
                        key,
                        {
                            ...value,
                            sceneName: (value.sceneName === action.oldSceneName) ? action.sceneName : value.sceneName,
                            timeoutScene: (value.timeoutScene === action.oldSceneName) ? action.sceneName : value.timeoutScene,
                            secondaryItems
                        }
                    ];
                })
            );

            // Regenerate the chat mappings
            const chatMappings = Object.entries(mappings).filter(e => !!e[1].chatCommand)
            return {
                ...state,

                // Update reward mappings
                mappings,
                chatMappings
            };
        }

        case OBS_SCENE_ITEM_REMOVED: {
            // Remove any references to the deleted scene item
            const mappings = Object.fromEntries(Object.entries(state.mappings)
                .map(([key, value]) => {
                    const secondaryItems = (value.secondaryItems || []).map(item => {
                        return {
                            ...item,
                            sceneItems: item.sceneItems.filter(sceneItemId => sceneItemId !== action.sceneItemId && item.sceneName === action.sceneName)
                        }
                    });
                    return [
                        key,
                        {
                            ...value,
                            sceneItems: value.sceneItems.filter(sceneItemId => sceneItemId !== action.sceneItemId && value.sceneName === action.sceneName),
                            secondaryItems
                        }
                    ];
                })
            );

            // Regenerate the chat mappings
            const chatMappings = Object.entries(mappings).filter(e => !!e[1].chatCommand)
            return {
                ...state,

                // Update reward mappings
                mappings,
                chatMappings
            };
        }

        //endregion

        default:
            return state;

    }
}