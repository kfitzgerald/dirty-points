import {
    ADD_SCENE_CYCLE_GROUP,
    ADD_SCENE_CYCLE_GROUP_ITEM,
    DELETE_SCENE_CYCLE_GROUP,
    DELETE_SCENE_CYCLE_GROUP_ITEM,
    OBS_CONNECTION_STATUS,
    OBS_SCENE_CREATED,
    OBS_SCENE_ITEM_CREATED, OBS_SCENE_ITEM_REMOVED,
    OBS_SCENE_LIST_CHANGED,
    OBS_SCENE_NAME_CHANGED,
    OBS_SCENE_REMOVED,
    REORDER_SCENE_CYCLE_GROUP_ITEM,
    SET_ACTIVE_SCENE_INDEX,
    SET_SCENE_CYCLE_PAUSED,
    START_SCENE_CYCLE,
    STOP_SCENE_CYCLE,
    UPDATE_OBS_CONNECTION_INFO,
    UPDATE_OBS_CONNECTION_STATE,
    UPDATE_OBS_CURRENT_SCENES,
    UPDATE_OBS_ERROR,
    UPDATE_OBS_SCENE_ITEM_LIST,
    UPDATE_OBS_SCENE_LIST,
    UPDATE_SCENE_CYCLE_GROUP,
    UPDATE_SCENE_CYCLE_GROUP_ITEM
} from "./OBSActions";
import {IMPORT_SETTINGS} from "../app/AppActions";

export const initialState = {
    // Connection info
    host: '127.0.0.1',
    port: 4455,
    password: null,

    // Status
    status: OBS_CONNECTION_STATUS.disconnected,
    currentProgramSceneName: null,
    currentPreviewSceneName: null,
    scenes: [],
    sceneItems: {}, // key=sceneName, value=[sources]

    // Rotator
    cycleGroups: [], // { name: '', duration: 30, scenes: [ { sceneId: '', sceneName: '', duration: 0 } ] }
    cycleEnabled: false, // whether the cycle is running or not
    cyclePaused: false, // flag marked by redemptions to temporarily pause the cycle controller
    activeCycle: null, // which cycle is selected
    activeCycleSceneIndex: null, // which scene in the cycle is active

    // If there was some sort of obs error, put it here
    lastError: null,
};

export default function OBSReducer(state = initialState, action) {
    switch (action.type) {

        //region Websocket state

        case UPDATE_OBS_CONNECTION_INFO:
            return {
                ...state,
                host: action.host,
                port: action.port,
                password: action.password
            };

        case UPDATE_OBS_CONNECTION_STATE:
            return {
                ...state,
                status: action.status,
                lastError: action.error
            };

        case UPDATE_OBS_ERROR:
            return {
                ...state,
                lastError: action.error
            };

        // OBS_SCENE_LIST_CHANGED will fire for these events
        case OBS_SCENE_CREATED:
        case OBS_SCENE_REMOVED:
            return state;

        // Scene items added/removed
        case OBS_SCENE_ITEM_CREATED:
        case OBS_SCENE_ITEM_REMOVED:
            return state;


        // OBS_SCENE_LIST_CHANGED also fires for these too
        case OBS_SCENE_NAME_CHANGED: {
            return {
                ...state,

                // Update scene name cycle mappings
                cycleGroups: [
                    ...state.cycleGroups.map(group => {
                        return {
                            ...group,
                            scenes: group.scenes.map(scene => {
                                return {
                                    ...scene,
                                    sceneName: (scene.sceneName === action.oldSceneName) ? action.sceneName : scene.sceneName
                                };
                            })
                        };
                    })
                ]
            }
        }

        //endregion

        //region Scene & Items state

        case OBS_SCENE_LIST_CHANGED:
        case UPDATE_OBS_SCENE_LIST:
            return {
                ...state,
                scenes: action.scenes
            };

        case UPDATE_OBS_SCENE_ITEM_LIST:
            return {
                ...state,
                sceneItems: {
                    ...state.sceneItems,
                    [action.sceneName] : action.sceneItems
                }
            };

        case UPDATE_OBS_CURRENT_SCENES: {
            const newState = {
                ...state,
            };
            if (typeof action.currentPreviewSceneName !== "undefined") {
                newState.currentPreviewSceneName = action.currentPreviewSceneName;
            }
            if (typeof action.currentProgramSceneName !== "undefined") {
                newState.currentProgramSceneName = action.currentProgramSceneName;
            }
            return newState;
        }

        //endregion

        //region Save/load state

        case IMPORT_SETTINGS:
            return {
                ...state,
                host: action.obs?.host,
                port: action.obs?.port,
                password: action.obs?.password,
                cycleGroups: action.obs?.cycleGroups
            };

        //endregion

        //region Cycle group state

        case START_SCENE_CYCLE: {
            const group = action.group || state.activeCycle;
            return {
                ...state,
                cycleEnabled: !!group,
                activeCycle: group,
                activeCycleSceneIndex: action.sceneIndex !== null ? action.sceneIndex : state.activeCycleSceneIndex
            };
        }

        case STOP_SCENE_CYCLE:
            return {
                ...state,
                cycleEnabled: false
            };

        case SET_SCENE_CYCLE_PAUSED:
            return {
                ...state,
                cyclePaused: action.paused
            };

        case SET_ACTIVE_SCENE_INDEX:
            return {
                ...state,
                activeCycleSceneIndex: action.sceneIndex
            };

        case ADD_SCENE_CYCLE_GROUP:
            return {
                ...state,
                cycleGroups: [ ...state.cycleGroups, action.group ]
            };

        case UPDATE_SCENE_CYCLE_GROUP: {
            const groupIndex = state.cycleGroups.findIndex(g => g === action.group)
            state.cycleGroups[groupIndex] = { ...action.data };
            return {
                ...state,
            };
        }

        case DELETE_SCENE_CYCLE_GROUP: {
            const groups = state.cycleGroups.filter(g => g !== action.group);
            return {
                ...state,
                cycleGroups: [ ...groups ]
            };
        }

        case ADD_SCENE_CYCLE_GROUP_ITEM: {
            const group = state.cycleGroups.find(g => action.group === g);
            if (!group) return state;
            group.scenes = [...group.scenes, action.item];
            return { ...state };
        }

        case UPDATE_SCENE_CYCLE_GROUP_ITEM: {
            const groupIndex = state.cycleGroups.findIndex(g => action.group === g);
            const group = state.cycleGroups[groupIndex];
            if (!group) return state;

            const sceneIndex = group.scenes.findIndex(i => i === action.item)
            if (sceneIndex < 0) return state;

            group.scenes[sceneIndex] = { ...action.data };

            return {...state};
        }

        case DELETE_SCENE_CYCLE_GROUP_ITEM: {
            const group = state.cycleGroups.find(g => action.group === g);
            if (!group) return state;

            group.scenes = group.scenes.filter(i => i !== action.item);

            return { ...state };
        }
        case REORDER_SCENE_CYCLE_GROUP_ITEM: {
            const group = state.cycleGroups.find(g => action.group === g);
            if (!group) return state;

            const scenes = [...group.scenes];
            const [item] = scenes.splice(action.sourceIndex, 1);
            scenes.splice(action.destinationIndex, 0, item);
            group.scenes = scenes;

            return state;
        }

        //endregion

        default:
            return state;

    }

}
