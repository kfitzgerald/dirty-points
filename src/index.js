import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './app/App';
import reportWebVitals from './reportWebVitals';
import configureStore from './configureStore';
import { Provider } from "react-redux";
import {RedemptionQueueContext} from "./redemptions/RedemptionQueueContext";
import {SceneQueue} from "./redemptions/SceneQueue";
import {SourceQueue} from "./redemptions/SourceQueue";
import SceneCycleController from "./obs/SceneCycleController";

// Setup Redux
const preloadedState = undefined;
const store = configureStore(preloadedState);

// Setup reward processing queues
export const sceneQueue = new SceneQueue(store);
export const sourceQueue = new SourceQueue(store);
export const cycleController = new SceneCycleController(store);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <Provider store={store}>
          <RedemptionQueueContext.Provider value={{
              sceneQueue,
              sourceQueue,
              cycleController
          }}>
              <App />
          </RedemptionQueueContext.Provider>
      </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
