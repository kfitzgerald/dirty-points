import { combineReducers } from 'redux';
import AppReducer from "./app/AppReducer";
import SessionReducer from "./session/SessionReducer";
import UserReducer from "./users/UserReducer";
import OBSReducer from "./obs/OBSReducer";
import RedemptionReducer from './redemptions/RedemptionReducer';

// noinspection JSUnusedGlobalSymbols
const reducers = combineReducers({
    app: AppReducer,
    session: SessionReducer,
    users: UserReducer,
    obs: OBSReducer,
    redemptions: RedemptionReducer
});

export default reducers;