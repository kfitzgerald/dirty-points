import {Alert, Button, Col, Container, Form, Modal, Row} from "react-bootstrap";
import CopyButton from "../common/CopyButton";
import {useSelector} from "react-redux";

export default function ExportModal({ show, onClose }) {
    const obs = useSelector(state => state.obs);
    const redemptions = useSelector(state => state.redemptions);

    const payload = {
        obs: {
            host: obs.host,
            port: obs.port,
            password: obs.password,
            cycleGroups: obs.cycleGroups
        },
        mappings: redemptions.mappings
    };

    const data = JSON.stringify(payload, null, 2);

    const blob = new window.Blob([data], {
        type: 'application/json'
    });
    const file = URL.createObjectURL(blob);

    // const a = document.createElement('a');
    // a.href = file;
    // a.download = 'dirty-points.json';
    // e.target.parentNode.appendChild(a);
    // a.click();
    // a.remove();
    // document.body.click();

    return (
        <>
            <Modal show={show} onHide={onClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Export Config
                    </Modal.Title>
                    <CopyButton value={data} variant="link" className="copy-channel-button">
                        <i className="bi bi-clipboard"></i>
                    </CopyButton>
                </Modal.Header>
                    <Modal.Body>
                        <Container>
                            <Row>
                                <Col>
                                    <h4>Option 1: Download</h4>
                                    <div className="mb-4 mt-4"><a href={file} download="dirty-points.json">Download JSON File</a></div>
                                    <Form.Text>Note: OBS browser docks cannot download files. Use option 2.</Form.Text>
                                </Col>
                                <Col className="text-center">
                                    <h4>Option 2: Drag</h4>
                                    <div className="export-file-icon" draggable="true" onDragStart={(e) => {
                                        e.dataTransfer.setData('DownloadURL', `application/json:dirty-points.json:${file}`);
                                    }}><i className="bi bi-file-earmark-arrow-down"></i></div>
                                    Drag file to filesystem to save
                                </Col>
                            </Row>
                            <Row className="pt-4 pb-0">
                                <Alert variant={"secondary"}>Fun Fact: You can drag the exported JSON file anywhere into the UI to import :D</Alert>
                            </Row>
                        </Container>
                    </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );

}