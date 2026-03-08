import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Accordion, Badge, Button, Container, Tab, Tabs} from "react-bootstrap";
import {
    connectToOBS,
    disconnectFromOBS,
    OBS_CONNECTION_STATUS,
} from "../obs/OBSActions";
import {
    connectToTwitch, disconnectFromTwitch,
    fetchManageableRedemptionList,
    fetchRedemptionList,
    TWITCH_CONNECTION_STATUS,
} from "./RedemptionActions";
import OBSSceneButtons from "../obs/OBSSceneButtons";
import OBSSettings from "../obs/OBSSettings";
import RewardsTable from "./RewardsTable";
import CreateRewardButton from "./CreateRewardButton";
import HoverToolTip from "../common/HoverToolTip";
import ReplayBufferSettings from "../obs/ReplayBufferSettings";

export default function RedeemList() {
    const dispatch = useDispatch();
    const obsStatus = useSelector(state => state.obs.status)
    const streamStatus = useSelector(state => state.obs.streamStatus)
    const replayBufferStatus = useSelector(state => state.obs.replayBufferStatus)
    const isSyncing = useSelector(state => state.obs.isSyncing)
    const redemptionStatus = useSelector(state => state.redemptions.status)

    const handleOBSUpdate = useCallback(async (/*event*/) => {
        switch (obsStatus) {
            case OBS_CONNECTION_STATUS.connected:
                return dispatch(disconnectFromOBS());

            case OBS_CONNECTION_STATUS.disconnected:
                return dispatch(connectToOBS());

            default:
                return;
        }
    }, [dispatch, obsStatus]);

    const handleTwitchRefresh = useCallback(async () => {
        switch (redemptionStatus) {
            case TWITCH_CONNECTION_STATUS.connected:
              return dispatch(disconnectFromTwitch());

            case TWITCH_CONNECTION_STATUS.disconnected:
                dispatch(connectToTwitch());
                dispatch(fetchRedemptionList());
                dispatch(fetchManageableRedemptionList());
                return;

            default:
                return;
        }
    }, [dispatch, redemptionStatus]);

    return (
        <Container>

            <div className="d-flex justify-content-between mt-3">
                <h2 className="d-flex align-items-center justify-content-left flex-wrap">
                    OBS <Badge className="ms-2 fs-sm"
                               bg={obsStatus === OBS_CONNECTION_STATUS.connected ? 'success' : obsStatus === OBS_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>socket {obsStatus}</Badge>
                    <Badge className="ms-2 fs-sm"
                           bg={obsStatus === OBS_CONNECTION_STATUS.connected && streamStatus.outputActive ? 'success' : 'danger'}>stream {obsStatus === OBS_CONNECTION_STATUS.connected && streamStatus.outputActive ? 'live' : 'stopped'}</Badge>
                    <Badge className="ms-2 fs-sm"
                           bg={obsStatus === OBS_CONNECTION_STATUS.connected && replayBufferStatus.outputActive ? 'success' : 'danger'}>replay {obsStatus === OBS_CONNECTION_STATUS.connected && replayBufferStatus.outputActive ? 'started' : 'stopped'}</Badge>
                </h2>
                <div>
                    <HoverToolTip text={isSyncing ? 'Syncing with OBS...' : obsStatus === OBS_CONNECTION_STATUS.connected ? 'Disconnect from OBS' : 'Connect to OBS'} placement="left" delay={250}>
                        <Button className="me-2" variant="secondary" disabled={isSyncing} onClick={handleOBSUpdate}><i
className={`bi ${isSyncing ? 'bi-arrow-clockwise icon-spin d-inline-block' : obsStatus === OBS_CONNECTION_STATUS.connected ? 'bi-pause-circle' : obsStatus === OBS_CONNECTION_STATUS.disconnected ? 'bi-play-circle' : 'bi-hourglass'}`}/></Button>
                    </HoverToolTip>
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
                <Accordion.Item eventKey={"replay"}>
                    <Accordion.Header>
                        OBS Replay Buffer
                    </Accordion.Header>
                    <Accordion.Body>
                        <ReplayBufferSettings/>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>

            <div className="d-flex justify-content-between mt-4 mb-2">
                <h2 className="d-flex align-items-center justify-content-center">
                    Twitch <Badge className="ms-2 fs-sm"
                                  bg={redemptionStatus === TWITCH_CONNECTION_STATUS.connected ? 'success' : redemptionStatus === TWITCH_CONNECTION_STATUS.connecting ? 'warning' : 'danger'}>{redemptionStatus}</Badge>
                </h2>
                <div>
                    <HoverToolTip text={obsStatus === TWITCH_CONNECTION_STATUS.connected ? 'Disconnect from Twitch' : 'Connect to Twitch'} placement="left" delay={250}>
                        <Button className="me-2" variant="secondary" onClick={handleTwitchRefresh}><i
className={`bi ${redemptionStatus === TWITCH_CONNECTION_STATUS.connected ? 'bi-pause-circle' : redemptionStatus === TWITCH_CONNECTION_STATUS.disconnected ? 'bi-play-circle' : 'bi-hourglass'}`}/></Button>
                    </HoverToolTip>
                    <CreateRewardButton/>
                </div>
            </div>

            <Tabs>
                <Tab eventKey="manageable" title="Manageable Rewards" className="pt-3">
                    <RewardsTable showOther={false}/>
                </Tab>
                <Tab eventKey="other" title="Other Rewards" className="pt-3">
                    <RewardsTable showOther />
                </Tab>

            </Tabs>

        </Container>
    );
}