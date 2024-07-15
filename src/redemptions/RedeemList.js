import {useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import './RedeemList.scss';
import {Accordion, Badge, Button, Container, Nav, Navbar, NavDropdown, Tab, Tabs} from "react-bootstrap";
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
} from "./RedemptionActions";
import twitchLogo from '../TwitchGlitchPurple.svg';
import obsLogo from '../OBS_Studio_Logo.svg';
import OBSSceneButtons from "../obs/OBSSceneButtons";
import OBSSettings from "../obs/OBSSettings";
import RewardsTable from "./RewardsTable";
import CreateRewardButton from "./CreateRewardButton";
import {useDropzone} from "react-dropzone";
import {importSettings} from "../app/AppActions";
import OBSSceneCycleView from "../obs/OBSSceneCycleView";
import { ReactComponent as PauseIcon } from "../pause-circle-fill.svg"
import { ReactComponent as PlayIcon } from "../play-circle-fill.svg"
import ExportModal from "./ExportModal";

export default function RedeemList() {
    const dispatch = useDispatch();
    const session = useSelector(state => state.session);
    const userCache = useSelector(state => state.users.cache);
    const obs = useSelector(state => state.obs);
    const redemptions = useSelector(state => state.redemptions);
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

    const { /*lastError,*/ token, data } = session;
    const { user_id, login } = data;

    useEffect(() => {
        dispatch(fetchUsers([data.user_id]));
        dispatch(fetchRedemptionList());
        dispatch(fetchManageableRedemptionList());
        dispatch(connectToOBS());
        dispatch(connectToTwitch());

        // Cleanup connnection when disposed
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

    const handleOBSUpdate = useCallback(async (/*event*/) => {
        await dispatch(disconnectFromOBS());
        dispatch(connectToOBS());
    }, [dispatch]);

    const handleTwitchRefresh = useCallback(async () => {
        await dispatch(disconnectFromTwitch());
        dispatch(connectToTwitch());
        dispatch(fetchRedemptionList());
        dispatch(fetchManageableRedemptionList());
    }, [dispatch]);

    const handleCycleToggle = useCallback(async () => {
        if (obs.activeCycle && obs.cycleEnabled) {
            dispatch(stopSceneCycle());
        } else if (obs.activeCycle && !obs.cycleEnabled) {
            dispatch(startSceneCycle());
        }
    }, [dispatch, obs])

    const getStatusButton = () => {
        let Icon = PauseIcon;
        if (!obs.activeCycle || !obs.cycleEnabled || obs.cyclePaused) {
            Icon = PlayIcon
        }
        return (
            <Button variant="link" className="fs-3 p-0 fs-6" onClick={handleCycleToggle} title={obs.activeCycle?.name || 'No cycle group selected'}>
                <Icon className={
                    (obs.activeCycle && obs.cycleEnabled && obs.cyclePaused) ? 'fill-warning' :
                        (obs.activeCycle && obs.cycleEnabled && !obs.cyclePaused) ? 'fill-info' :
                            (obs.activeCycle && !obs.cycleEnabled) ? 'fill-primary' : 'fill-secondary'
                } />
            </Button>
        );
    }

    return (
        <div className="redeem-page" {...getRootProps({className: 'dropz'})}>
            <Tab.Container id="stream-tabs" defaultActiveKey="mappings">
                <div className="navbar navbar-expand navbar-dark bg-dark sticky-top">
                    <Container>
                        <Nav className="me-auto" navbar={true} bsPrefix="navbar-nav">
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
                                {getStatusButton()}
                                <div>
                                <img src={obsLogo} alt="Twitch" title={obs.status} />
                                    <Badge bg={obs.status === OBS_CONNECTION_STATUS.connected ? 'success' : obs.status === OBS_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>&nbsp;</Badge>
                                </div>
                                <div>
                                    <img src={twitchLogo} alt="OBS" title={redemptions.status} />
                                    <Badge bg={redemptions.status === TWITCH_CONNECTION_STATUS.connected ? 'success' : redemptions.status === TWITCH_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>&nbsp;</Badge>
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
                        <Container>

                            <div className="d-flex justify-content-between mt-3">
                                <h2 className="d-flex align-items-center justify-content-center">
                                    OBS <Badge className="ms-2 fs-sm"
                                               bg={obs.status === OBS_CONNECTION_STATUS.connected ? 'success' : obs.status === OBS_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>{obs.status}</Badge>
                                </h2>
                                <div>
                                    <Button className="me-2" variant="secondary" onClick={handleOBSUpdate}><i
                                        className="bi bi-arrow-clockwise"></i></Button>
                                </div>
                            </div>


                            <Accordion className="mb-4 mt-3">
                                <Accordion.Item eventKey={"scenes"}>
                                    <Accordion.Header>
                                        Scene List
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <OBSSceneButtons/>
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey={"config"}>
                                    <Accordion.Header>
                                        OBS WebSocket
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <OBSSettings/>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>

                            <div className="d-flex justify-content-between mt-4 mb-2">
                                <h2 className="d-flex align-items-center justify-content-center">
                                    Twitch <Badge className="ms-2 fs-sm"
                                                  bg={redemptions.status === TWITCH_CONNECTION_STATUS.connected ? 'success' : redemptions.status === TWITCH_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>{redemptions.status}</Badge>
                                </h2>
                                <div>
                                    <Button className="me-2" variant="secondary" onClick={handleTwitchRefresh}><i
                                        className="bi bi-arrow-clockwise"></i></Button>
                                    <CreateRewardButton/>
                                </div>
                            </div>

                            <Tabs>
                                <Tab eventKey="manageable" title="Manageable Rewards" className="pt-3">
                                    <RewardsTable showOther={false}/>
                                </Tab>
                                <Tab eventKey="other" title="Other Rewards" className="pt-3">
                                    <RewardsTable showOther={true}/>
                                </Tab>

                            </Tabs>

                            {/*dropzone input field*/}
                            <input {...getInputProps()} />

                        </Container>
                    </Tab.Pane>

                    <Tab.Pane eventKey="rotation">
                        <OBSSceneCycleView />
                    </Tab.Pane>

                </Tab.Content>
            </Tab.Container>
            <ExportModal show={showExportModal} onClose={handleCloseExportModal} />
        </div>
    );
}