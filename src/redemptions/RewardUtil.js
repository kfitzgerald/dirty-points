export function convertStringMapping(mapping) {
    return {
        sceneName: mapping,
        sceneItems: [],
        timeout: 0,
        timeoutScene: '',
        chatCommand: '',
        chatCommandBadges: [],
        secondaryItems: []
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
        secondaryItems: []
    }
}