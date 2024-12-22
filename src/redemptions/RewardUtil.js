import {MAPPING_TYPES} from "../common/Constants";

export function convertStringMapping(mapping) {
    return {
        sceneName: mapping,
        sceneItems: [],
        timeout: 0,
        timeoutScene: '',
        chatCommand: '',
        chatCommandBadges: [],
        secondaryItems: [],
        sourceFilters: []
    }
}

export function getEmptyMapping() {
    return {
        sceneName: '',
        sceneItems: [],
        timeout: 0,
        timeoutScene: '',
        chatCommand: '',
        chatCommandBadges: [],
        secondaryItems: [],
        sourceFilters: []
    }
}

export function getMappingType(mapping) {
    if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

    if (mapping.sourceFilters && mapping.sourceFilters.length > 0) {
       return MAPPING_TYPES.FILTER_TOGGLE;

    } else if (mapping.sceneName && mapping.sceneItems.length === 0) {
        return MAPPING_TYPES.SCENE_CHANGE;

    } else if (mapping.sceneName && mapping.sceneItems.length > 0) {
        return MAPPING_TYPES.SOURCE_TOGGLE;

    } else {
        return null;
    }
}