import {useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import './MainView.scss';
import {Badge, Button, Container, Nav, Navbar, NavDropdown, Tab} from "react-bootstrap";
import {revokeToken} from "../session/SessionActions";
import {fetchUsers} from "../users/UserActions";
import {
    connectToOBS,
    disconnectFromOBS,
    OBS_CONNECTION_STATUS, startSceneCycle, stopSceneCycle,
} from "../obs/OBSActions";
import {
    connectToTwitch, disconnectFromTwitch,
    fetchManageableRedemptionList,
    fetchRedemptionList,
    TWITCH_CONNECTION_STATUS,
} from "../redemptions/RedemptionActions";
import twitchLogo from '../img/TwitchGlitchPurple.svg';
import obsLogo from '../img/OBS_Studio_Logo.svg';
import {useDropzone} from "react-dropzone";
import {importSettings, setFullStopEnabled} from "./AppActions";
import OBSSceneCycleView from "../obs/OBSSceneCycleView";
import { ReactComponent as StopIcon } from "../img/sign-stop.svg"
import { ReactComponent as StopIconFilled } from "../img/sign-stop-fill.svg"
import { ReactComponent as PauseIcon } from "../img/pause-circle-fill.svg"
// import { ReactComponent as PlayIcon } from "../play-circle-fill.svg"
import { ReactComponent as PlayIcon } from "../img/arrow-repeat.svg"
import ExportModal from "../redemptions/ExportModal";
import HoverToolTip from "../common/HoverToolTip";
import RedeemList from "../redemptions/RedeemList";

export default function MainView() {
    const dispatch = useDispatch();
    const obsStatus = useSelector(state => state.obs.status)
    const activeCycle = useSelector(state => state.obs.activeCycle)
    const cycleEnabled = useSelector(state => state.obs.cycleEnabled)
    const cyclePaused = useSelector(state => state.obs.cyclePaused)
    const token = useSelector(state => state.session.token)
    const data = useSelector(state => state.session.data)
    const userCache = useSelector(state => state.users.cache)
    const redemptionStatus = useSelector(state => state.redemptions.status)
    const fullStop = useSelector(state => state.app.fullStop)
    const [ showExportModal, setShowExportModal ] = useState(false);
    const {getRootProps, getInputProps, open} = useDropzone({
        // Disable click and keydown behavior
        noClick: true,
        noKeyboard: true,
        accept: {
            'application/json': ['.json'], // saved docs
        },
        onDrop: (files) => {
            return Promise.all(files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {

                        if (file.type.startsWith('application/json')) {
                            console.log('importing', JSON.parse(e.target.result))
                            dispatch(importSettings(JSON.parse(e.target.result)));
                        }

                        resolve();

                    };

                    if (file.type.startsWith('application/json')) {
                        reader.readAsText(file);
                    } else {
                        reader.readAsDataURL(file);
                    }

                });
            }));
        }
    });

    const { user_id, login } = data;

    useEffect(() => {
        dispatch(fetchUsers([data.user_id]));
        dispatch(fetchRedemptionList());
        dispatch(fetchManageableRedemptionList());
        dispatch(connectToOBS());
        dispatch(connectToTwitch());

        // Cleanup connection when disposed
        return () => {
            dispatch(disconnectFromOBS());
            dispatch(disconnectFromTwitch());
        };
    }, [ token, data, dispatch ]);

    const handleSignOut = useCallback(() => {
        dispatch(revokeToken());
    }, [dispatch]);

    const handleCloseExportModal = useCallback(() => {
        setShowExportModal(false);
    }, []);

    const handleShowExportModal = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowExportModal(true);
    }, []);

    const handleImportSettings = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        open();
        document.body.click();
    }, [open]);

    const handleCycleToggle = useCallback(async () => {
        if (activeCycle && cycleEnabled) {
            dispatch(stopSceneCycle());
        } else if (activeCycle && !cycleEnabled) {
            dispatch(startSceneCycle());
            if (fullStop) {
                dispatch(setFullStopEnabled(false));
            }
        }
    }, [dispatch, activeCycle, cycleEnabled, fullStop]);

    const handleFullStopToggle = useCallback(async () => {
        dispatch(setFullStopEnabled(!fullStop));
        // 2024-09-03: Disabling this functionality so it works more like the obs studio mode integration
        // if (obs.activeCycle && obs.cycleEnabled && (!fullStop)) {
        //     dispatch(stopSceneCycle());
        // }
    }, [dispatch, fullStop/*, obs*/]);

    const getStatusButton = () => {
        let Icon = PauseIcon;
        if (!activeCycle || !cycleEnabled || cyclePaused) {
            Icon = PlayIcon
        }
        return (
            <HoverToolTip text={activeCycle ? `Toggle current cycle group: ${activeCycle?.name}` : 'No cycle group selected'} placement="bottom" delay={250}>
                <Button variant="link" className="fs-3 p-0 fs-6" onClick={handleCycleToggle}>
                    <Icon className={
                        (activeCycle && cycleEnabled && cyclePaused) ? 'fill-warning' :
                            (activeCycle && cycleEnabled && !cyclePaused) ? 'fill-info' :
                                (activeCycle && !cycleEnabled) ? 'fill-primary' : 'fill-secondary'
                    } />
                </Button>
            </HoverToolTip>
        );
    }

    const getFullStopButton = () => {
        let Icon = StopIcon;
        if (fullStop) {
            Icon = StopIconFilled;
        }
        return (
            <HoverToolTip text={fullStop ? 'Resume redemptions and cycling' : 'Stop redemptions and cycling'} placement="bottom" delay={250}>
                <Button variant="link" className="fs-3 p-0 fs-6" onClick={handleFullStopToggle}>
                    <Icon className={
                        (fullStop) ? 'fill-danger' : 'fill-secondary'
                    } />
                </Button>
            </HoverToolTip>
        );
    }

    return (
        <div className="main-page" {...getRootProps({className: 'dropz'})}>
            <Tab.Container id="stream-tabs" defaultActiveKey="mappings">
                <div className="navbar navbar-expand navbar-dark bg-dark sticky-top">
                    <Container>
                        <Nav className="me-auto" navbar bsPrefix="navbar-nav">
                            <Nav.Item>
                                <Nav.Link eventKey="mappings">Rewards</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="rotation">Cycle</Nav.Link>
                            </Nav.Item>
                            {/*  Future tabs here  */}
                        </Nav>
                        <Navbar.Toggle />
                        <Navbar.Collapse className="justify-content-end">
                            <div className="service-status">
                                {getFullStopButton()}
                                {getStatusButton()}
                                <div>
                                    <HoverToolTip text={`OBS: ${obsStatus}`} placement="bottom" delay={250}>
                                        <img src={obsLogo} alt="Twitch" title={obsStatus} />
                                    </HoverToolTip>
                                    <Badge bg={obsStatus === OBS_CONNECTION_STATUS.connected ? 'success' : obsStatus === OBS_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>&nbsp;</Badge>
                                </div>
                                <div>
                                    <HoverToolTip text={`Twitch: ${redemptionStatus}`} placement="bottom" delay={250}>
                                        <img src={twitchLogo} alt="OBS" title={redemptionStatus} />
                                    </HoverToolTip>
                                    <Badge bg={redemptionStatus === TWITCH_CONNECTION_STATUS.connected ? 'success' : redemptionStatus === TWITCH_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>&nbsp;</Badge>
                                </div>
                            </div>
                            <NavDropdown title={<><img src={userCache[user_id]?.profile_image_url || twitchLogo} alt="" /> {userCache[user_id]?.display_name || login}</>} id="user-dropdown" align="end">
                                <NavDropdown.Item onClick={handleImportSettings}>Import settings</NavDropdown.Item>
                                <NavDropdown.Item onClick={handleShowExportModal}>Export settings</NavDropdown.Item >
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleSignOut}>Sign out</NavDropdown.Item>
                            </NavDropdown>
                        </Navbar.Collapse>
                    </Container>
                </div>
                <Tab.Content>

                    <Tab.Pane eventKey="mappings">
                        <RedeemList />
                    </Tab.Pane>

                    <Tab.Pane eventKey="rotation">
                        <OBSSceneCycleView />
                    </Tab.Pane>

                </Tab.Content>
            </Tab.Container>
            <ExportModal show={showExportModal} onClose={handleCloseExportModal} />

            {/*dropzone input field*/}
            <input {...getInputProps()} />
        </div>
    );
}