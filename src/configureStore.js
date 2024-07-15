import { createStore, compose, applyMiddleware } from 'redux';
import persistState from 'redux-localstorage';
import Thunk from 'redux-thunk';

import rootReducer from './reducers';
import {initialSessionState} from "./session/SessionReducer";
import {initialState as initialAppState} from './app/AppReducer';
import {initialState as initialUserState} from './users/UserReducer';
import {initialState as initialRedemptionState} from './redemptions/RedemptionReducer';
import {initialState as initialOBSState} from './obs/OBSReducer';

let composer = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

let enhancers = composer(
    persistState(['session'], {
        key: 'dp_session',
        slicer: (/*paths*/) => {
            return (state) => {
                return {
                    app: {
                        preferences: {
                            ...state.app.preferences,
                        }
                    },
                    session: {
                        token: {
                            ...state.session.token || {},
                        }
                    },
                    users: {
                        cache: {
                            ...state.users.cache,
                        }
                    },
                    redemptions: {
                        mappings: {
                            ...state.redemptions.mappings
                        },
                        chatMappings: [
                            ...state.redemptions.chatMappings
                        ]
                    },
                    obs: {
                        host: state.obs.host,
                        port: state.obs.port,
                        password: state.obs.password,
                        cycleGroups: state.obs.cycleGroups
                    }
                };
            };
        },
        merge: (initialState, persistedState) => {
            // if (!persistedState?.session?.token?.access_token) return initialState;
            // TODO: add a check for app version, and only merge if versions match
            return {
                ...initialState, // ignore stored fetching/error states

                app: {
                    ...initialAppState,
                    preferences: {
                        ...initialAppState.preferences,
                        ...persistedState.app.preferences
                    }
                },

                session: {
                    ...initialSessionState,                 // default session state
                    token: {
                        ...persistedState.session.token,    // only persist the token, validation will be done on load
                    }
                },

                users: {
                    ...initialUserState,
                    cache: {
                        ...initialUserState.cache,
                        ...persistedState.users.cache
                    }
                },

                redemptions: {
                    ...initialRedemptionState,
                    mappings: {
                        ...initialRedemptionState.mappings,
                        ...persistedState.redemptions.mappings
                    },
                    chatMappings: [
                        ...persistedState.redemptions.chatMappings
                    ]
                },

                obs: {
                    ...initialOBSState,
                    host: persistedState.obs.host,
                    port: persistedState.obs.port,
                    password: persistedState.obs.password,
                    cycleGroups: persistedState.obs.cycleGroups || []
                }

            };
        }
    }),
    applyMiddleware(Thunk)
);

const configureStore = preloadedState => createStore(
    rootReducer,
    preloadedState,
    enhancers
);

export default configureStore;