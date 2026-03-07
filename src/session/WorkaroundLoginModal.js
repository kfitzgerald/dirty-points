import {Button, Form, Modal} from "react-bootstrap";
import HoverToolTip from "../common/HoverToolTip";
import {useCallback, useRef} from "react";

export default function WorkaroundLoginModal({ show, onClose, onLogin }) {
    const urlRef = useRef(null)

    const attemptLogin = useCallback(() => {
        const url = urlRef.current.value;
        if (!url) return;

        onLogin(url);
    }, [urlRef, onLogin]);

    return (
        <>
            <Modal show={show} onHide={onClose}>
                <Form>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Troubleshooting Login
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="url" className="mb-3">
                            <Form.Label className="fw-semibold">Redirect URL</Form.Label>
                            <HoverToolTip text="Paste the authentication url here" placement="top" delay={250}>
                                <Form.Control
                                    name="url"
                                    type="string"
                                    ref={urlRef}
                                />
                            </HoverToolTip>
                            <Form.Text>Paste your special login url here</Form.Text>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                        <Button variant="success" onClick={attemptLogin}>
                            Login
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}