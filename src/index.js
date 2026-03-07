import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import App from './app/App';
import reportWebVitals from './reportWebVitals';
import configureStore from './configureStore';
import { Provider } from "react-redux";
import {RedemptionQueueContext} from "./redemptions/RedemptionQueueContext";
import {SceneQueue} from "./redemptions/SceneQueue";
import {SourceQueue} from "./redemptions/SourceQueue";
import SceneCycleController from "./obs/SceneCycleController";
import * as Sentry from "@sentry/react";
import {FilterQueue} from "./redemptions/FilterQueue";
import {ActionQueue} from "./redemptions/ActionQueue";

// Report errors in production only
if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: process.env.REACT_APP_SENTRY_DSN,
    });
}

// Setup Redux
const preloadedState = undefined;
const store = configureStore(preloadedState);

// Setup reward processing queues
export const sceneQueue = new SceneQueue(store);
export const sourceQueue = new SourceQueue(store);
export const filterQueue = new FilterQueue(store);
export const actionQueue = new ActionQueue(store);
export const cycleController = new SceneCycleController(store);

let root;

// Create a render function that can be called from HMR
const renderRoot = () => {
    if (!root) {
        console.warn('Root not initialized');
        return;
    }

    console.log('Rendering app with current App component...');
    root.render(
        <StrictMode>
            <Provider store={store}>
                <RedemptionQueueContext.Provider value={{
                    sceneQueue,
                    sourceQueue,
                    filterQueue,
                    actionQueue,
                    cycleController
                }}>
                    <App />
                </RedemptionQueueContext.Provider>
            </Provider>
        </StrictMode>
    );
};

document.addEventListener('DOMContentLoaded', function() {
    if (!root) {
        console.log('Initializing React root...');
        root = createRoot(document.getElementById('root'));
        renderRoot();
    }
});


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
