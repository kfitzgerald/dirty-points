import logo from './logo.svg';
import './App.scss';

import {connect, disconnect, getSceneList} from './obs/OBS';
import {useEffect} from "react";

function App() {

    const obsPassword = 'xGiFCfCNBjrn2Zeq';
    const obsHost = '127.0.0.1';
    const obsPort = 4455;

    useEffect(() => {
        let ticker;
        connect(obsPassword, obsHost, obsPort)
            .then(() => {
                return getSceneList();
            })
            .then((/*res*/) => {
                // console.log('scenes', res);
                // const { scenes } = res;
                //
                // let index = 0;
                // function toggle() {
                //     if (++index >= scenes.length) index = 0;
                //     setScene(scenes[index].sceneName).catch(err => console.log('failed to set scene'));
                // }
                //
                // ticker = setInterval(toggle, 2000);

            })
            .catch((/*err*/) => {
                console.error('something farted', err)
            });

        return () => {
            clearInterval(ticker);
            disconnect();
        };
    });

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.js</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
