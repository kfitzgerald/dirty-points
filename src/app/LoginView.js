import {useCallback, useEffect} from "react";
import logo from '../img/logo.svg';
import './App.scss';
import {useDispatch, useSelector} from "react-redux";
import {fetchTokenValidate, receiveTokenValidateError, setOAuthToken} from "../session/SessionActions";
import {Alert, Button, ButtonGroup, Dropdown} from "react-bootstrap";

import {REQUIRED_SCOPES} from "../common/Constants";
import ErrorMessage from "../common/ErrorMessage";
import WorkaroundLoginModal from "../session/WorkaroundLoginModal";
import {setShowWorkaroundLoginModal} from "./AppActions";
import CopyElement from "../common/CopyElement";
import Loading from "../common/Loading";

// Import electron IPC for OAuth callback handling
const { ipcRenderer } = window.require && window.require('electron') || {};

function cleanURL() {
    window.history.replaceState("", document.title, window.location.pathname);
}

function LoginView() {

    const dispatch = useDispatch();
    const lastError = useSelector(state => state.session.lastError);
    const token = useSelector(state => state.session.token);
    const data = useSelector(state => state.session.data);
    const showWorkaroundLoginModal = useSelector(state => state.app.showWorkaroundLoginModal);

    const checkURLforOAuthParams = useCallback((url) => {
        // Check for OAuth authorization
        if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1))
            const hashData = Object.fromEntries(hashParams.entries());
            dispatch(setOAuthToken(hashData));
            cleanURL();
        }

        // Check for OAuth error
        if (url.search) {
            const searchParams = new URLSearchParams(url.search.substring(1))
            const searchData = Object.fromEntries(searchParams.entries());
            dispatch(receiveTokenValidateError(searchData));
            cleanURL();
        }
    }, [ dispatch ])

    const handleWorkaroundLogin = useCallback((url) => {
        try {
            checkURLforOAuthParams(new URL(url));
        } catch (err) {
            console.error('Invalid URL from workaround login:', url, err);
        }
    }, [checkURLforOAuthParams]);

    // Check for oauth return params on load
    useEffect(() => {

        // Check for OAuth authorization
        if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const hashData = Object.fromEntries(hashParams.entries());
            if (hashParams.has('access_token') && hashParams.has('scope') && hashParams.has('state') && hashParams.has('token_type')) {
                dispatch(setOAuthToken(hashData));
                cleanURL();
            }
        }

        // Check for OAuth error
        if (window.location.search) {
            const searchParams = new URLSearchParams(window.location.search.substring(1))
            const searchData = Object.fromEntries(searchParams.entries());
            if (searchParams.has('error')) {
                dispatch(receiveTokenValidateError(searchData));
                cleanURL();
            }
        }

    }, [dispatch]);

    // Listen for OAuth callback from Electron main process (URL scheme handler)
    useEffect(() => {
        if (!ipcRenderer) return; // Only in Electron environment

        const handleOAuthCallback = (event, oauthData) => {
            console.log('mog we got the token', event, oauthData);
            dispatch(setOAuthToken(oauthData));
            cleanURL();
        };

        ipcRenderer.on('oauth-callback', handleOAuthCallback);
        ipcRenderer.on('show-login-workaround', () => {
            dispatch(setShowWorkaroundLoginModal(true))
        });

        return () => {
            ipcRenderer.removeListener('oauth-callback', handleOAuthCallback);
        };
    }, [dispatch]);

    // Validate the token on load to ensure the session is still valid
    useEffect(() => {

        // If token but no session data, do validation
        if (token && token.access_token && !data) {
            dispatch(fetchTokenValidate());
        }

    }, [dispatch, token, data])

    // If the token is saved but not validated, show loader
    if (!lastError && token && token.access_token && !data) {
        // token is received, needs verification (show loading screen)
        return <Loading/>;
    }

    // Build OAuth authorize URL
    const oauthParams = new URLSearchParams();
    oauthParams.set('client_id', process.env.REACT_APP_CLIENT_ID)
    oauthParams.set('force_verify', 'false')
    oauthParams.set('redirect_uri', window.location.href.split('?')[0])
    oauthParams.set('redirect_uri', window.location.href)
    oauthParams.set('response_type', 'token');
    oauthParams.set('scope', REQUIRED_SCOPES.join(' '));
    oauthParams.set('state', ':)')

    return (
        <div className="App">
            <div className="App-header">
                {lastError ? (
                    <Alert variant="danger">
                        <ErrorMessage error={lastError} />
                    </Alert>
                ) : (
                    <img src={logo} className="App-logo" alt="logo" />
                )}
                <p>
                    <code>DirtyPoints™</code> connects Twitch redemptions to OBS.
                </p>
                <div className="mb-3">To get started,  <Dropdown as={ButtonGroup}>
                        <Button variant="primary"
                                className="App-link"
                                href={"https://id.twitch.tv/oauth2/authorize?" + oauthParams.toString()}
                                rel="noreferrer"
                        >Login with Twitch</Button>

                        <Dropdown.Toggle split variant="primary" id="dropdown-split-basic" />

                        <Dropdown.Menu>
                            <CopyElement Component={Dropdown.Item} href="#" value={"https://id.twitch.tv/oauth2/authorize?" + oauthParams.toString()}>Copy login link</CopyElement>
                            <Dropdown.Item onClick={() =>
                                dispatch(setShowWorkaroundLoginModal(true))
                            }>Still not working?</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <footer><a href="https://github.com/kfitzgerald/dirty-points#add-to-obs" target="_blank" rel="noreferrer">Setup an OBS Dock</a> • <a href="https://github.com/kfitzgerald/dirty-points" target="_blank" rel="noreferrer">Open Source</a> app made by <a href="https://www.twitch.tv/dirtybriefs" target="_blank" rel="noreferrer">Dirtybriefs</a>.</footer>
            </div>
            <WorkaroundLoginModal show={showWorkaroundLoginModal} onClose={() => dispatch(setShowWorkaroundLoginModal(false))} onLogin={handleWorkaroundLogin} />
        </div>
    );
}

export default LoginView;
