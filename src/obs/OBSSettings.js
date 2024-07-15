import {Button, Form} from "react-bootstrap";
import {connectToOBS, disconnectFromOBS, updateOBSConnectionInfo} from "./OBSActions";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";

export default function OBSSettings() {
    const dispatch = useDispatch();
    const obs = useSelector(state => state.obs);
    const { host, port, password } = obs;

    const handleOBSUpdate = useCallback(async (e) => {
        e.preventDefault();
        await dispatch(disconnectFromOBS());
        dispatch(connectToOBS());
    }, [dispatch]);

    return (
        <Form onSubmit={handleOBSUpdate}>
            <Form.Group controlId="host" className="mb-3">
                <Form.Label>Host</Form.Label>
                <Form.Control type="text" value={obs.host} onChange={(e) => {
                    dispatch(updateOBSConnectionInfo({
                        host: e.target.value || '127.0.0.1',
                        port,
                        password,
                    }));
                }}/>
            </Form.Group>
            <Form.Group controlId="port" className="mb-3">
                <Form.Label>Port</Form.Label>
                <Form.Control type="number" value={obs.port} onChange={(e) => {
                    dispatch(updateOBSConnectionInfo({
                        host,
                        port: parseInt(e.target.value || 4455),
                        password,
                    }));
                }}/>
            </Form.Group>
            <Form.Group controlId="password" className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={obs.password} onChange={(e) => {
                    dispatch(updateOBSConnectionInfo({
                        host,
                        port,
                        password: e.target.value,
                    }));
                }}/>
            </Form.Group>
            <Button variant="primary" type="submit">
                Update OBS Settings
            </Button>
        </Form>
    );
}