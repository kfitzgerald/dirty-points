import {useDispatch} from "react-redux";
import {useCallback, useEffect, useRef} from "react";
import {Button, Form, Modal} from "react-bootstrap";
import {updateSceneCycleGroup} from "./OBSActions";
import {Formik} from "formik";
import * as Yup from "yup";


export default function SceneCycleEditModal({ show, onClose, sceneCycleGroup=null }) {
    const dispatch = useDispatch();
    const textRef = useRef(null);

    const onSubmit = useCallback(async (data) => {
        const { name } = data;

        if (sceneCycleGroup && name && name.trim()) {
            dispatch(updateSceneCycleGroup(sceneCycleGroup, {
                ...sceneCycleGroup,
                name: name.trim()
            }));
            onClose();
        }

    }, [ dispatch, sceneCycleGroup, onClose ]);

    useEffect(() => {
        if (show && textRef.current) {
            textRef.current.focus();
        }
    }, [show]);

    return (
        <Modal show={show} onHide={onClose}>
            <Formik
                onSubmit={onSubmit}
                validationSchema={Yup.object({
                    name: Yup.string().max(140).label('title').required(),
                })}
                initialValues={sceneCycleGroup ? {
                    name: sceneCycleGroup.name || ''
                } : {
                    name: ''
                }}
            >
                {({ handleSubmit, errors, handleChange, handleBlur, values, touched }) => {
                    // console.log({ errors, values });
                    return (

                        <Form onSubmit={handleSubmit}>
                            <Modal.Header closeButton>
                                <Modal.Title>
                                    Edit Scene Group
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>

                                <Form.Group controlId="name" className="mb-3">
                                    <Form.Label className="fw-semibold">Name</Form.Label>
                                    <Form.Control
                                        ref={textRef}
                                        name="name"
                                        value={values.name}
                                        isInvalid={touched.name && !!errors.name}
                                        placeholder={"e.g. Camera scenes"}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        type="text"
                                        maxLength={140}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                </Form.Group>
                            </Modal.Body>
                            <Modal.Footer>
                                {/*{sceneCycleGroup && (*/}
                                {/*    <div className="flex-grow-1">*/}
                                {/*        <Button variant="danger" onClick={handleDelete} className="me-2">*/}
                                {/*            <i className="bi bi-trash3-fill"/>*/}
                                {/*        </Button>*/}
                                {/*        <Button variant="warning" onClick={handleDuplicate}>*/}
                                {/*            <i className="bi bi-copy"/>*/}
                                {/*        </Button>*/}
                                {/*    </div>*/}
                                {/*)}*/}
                                <Button variant="secondary" onClick={onClose}>
                                    Close
                                </Button>
                                <Button variant="primary" type="submit" onClick={handleSubmit}>
                                    Save Changes
                                </Button>
                            </Modal.Footer>

                        </Form>
                    );
                }}
            </Formik>
        </Modal>
    );
}