import {
    Accordion,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    useAccordionButton
} from "react-bootstrap";
import {shallowEqual, useDispatch, useSelector} from "react-redux";
import {useCallback, useState} from "react";
import * as Yup from "yup";
import {useFormik} from "formik";
import {
    addSceneCycleGroup,
    addSceneCycleItem,
    deleteSceneCycleGroup,
    reorderSceneCycleItem, startSceneCycle, stopSceneCycle,
    updateSceneCycleGroup
} from "./OBSActions";
import {DragDropContext} from "react-beautiful-dnd";
import SceneGroupDroppable from "./SceneGroupDroppable";
import {setFullStopEnabled} from "../app/AppActions";
import SceneCycleEditModal from "./SceneCycleEditModal";
import HoverToolTip from "../common/HoverToolTip";

export function getEmptySceneItem() {
    return {
        enabled: true,
        sceneName: null,
        sceneIndex: null,
        duration: 0
    };
}

export default function OBSSceneCycleView() {
    const dispatch = useDispatch();
    const [obs, fullStop] = useSelector(state => [state.obs, state.app.fullStop], shallowEqual);
    const [accordionKey, setAccordionKey] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const { cycleGroups, activeCycle, cycleEnabled } = obs;

    const handleCreateSceneGroup = useCallback((data) => {
        dispatch(addSceneCycleGroup({
            ...data,
            scenes: [
                getEmptySceneItem(),
                getEmptySceneItem(),
                getEmptySceneItem()
            ]
        }))
        setAccordionKey(cycleGroups.length);
        formik.resetForm();
    }, [dispatch, cycleGroups]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDragScene = useCallback((event, group) => {
        if (!event.source || !event.destination) return;
        // console.log('drop', event.source, event.destination)
        dispatch(reorderSceneCycleItem(group, event.source.index, event.destination.index))
    }, [ dispatch ]);

    const handleAddNewScene = useCallback((group) => {
        dispatch(addSceneCycleItem(group, getEmptySceneItem()))
    }, [ dispatch ]);

    const handleDeleteGroup = useCallback((group) => {
        dispatch(deleteSceneCycleGroup(group));
    }, [ dispatch ]);

    const handleUpdateSceneDuration = useCallback((event, group) => {
        dispatch(updateSceneCycleGroup(group, {
            ...group,
            duration: parseFloat(event.target.value || 0)
        }))
    }, [ dispatch ]);

    const handleRenameSceneGroup = useCallback((group) => {
        setEditingGroup(group);
        setShowEditModal(true);
    }, []);

    const handleGroupPlayPauseClick = useCallback((group) => {
        if (activeCycle === group && cycleEnabled) {
            // pause
            return dispatch(stopSceneCycle());
        }

        // play
        dispatch(startSceneCycle(group));

        if (fullStop) {
            dispatch(setFullStopEnabled(false));
        }

    }, [ dispatch, activeCycle, cycleEnabled, fullStop ]);

    const handleEditGroupClose = useCallback(() => {
        setShowEditModal(false);
    }, [setShowEditModal]);

    const formik = useFormik({
        initialValues: {
            name: '',
            duration: 15
        },
        onSubmit: handleCreateSceneGroup,
        validationSchema: Yup.object({
            name: Yup.string().max(140).label('name').required(),
            duration: Yup.number().min(0).label('duration')
        })
    });

    return (
        <Container>
            <div className="d-flex justify-content-between mt-4 mb-2">
                <h4 className="d-flex align-items-center justify-content-center">
                    Create Scene Group
                </h4>
            </div>
            <Form onSubmit={formik.handleSubmit}>
                <Row>
                    <Form.Group as={Col} xs={5} controlId="name" className="mb-3">
                        <Form.Label className="fw-semibold">Group Name</Form.Label>
                        <Form.Control
                            name="name"
                            value={formik.values.name}
                            isInvalid={formik.touched.name && !!formik.errors.name}
                            placeholder={"e.g. All camera angles"}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            type="text"
                            maxLength={140}
                        />
                        <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group as={Col} xs={3} controlId="duration" className="mb-3">
                        <Form.Label className="fw-semibold">Base Duration</Form.Label>
                        <HoverToolTip text="Duration in seconds to show each scene by default" placement="top" delay={250}>
                            <Form.Control
                                name="duration"
                                type="number"
                                value={formik.values.duration}
                                isInvalid={formik.touched.duration && !!formik.errors.duration}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                min={0}
                            />
                        </HoverToolTip>
                        <Form.Control.Feedback type="invalid">{formik.errors.duration}</Form.Control.Feedback>
                    </Form.Group>
                    <Col xs={4}>
                        <Form.Label className="fw-semibold w-100">&nbsp;</Form.Label>
                        <Button type="submit"><i className="bi bi-plus-circle"/> Create Group</Button>
                    </Col>
                </Row>
            </Form>

            <hr />

            <h2>Scene Groups</h2>
            {cycleGroups.length === 0 ? (
                <Row><Col><em>You have no scene groups :(</em></Col></Row>
            ) : (
                <Accordion activeKey={accordionKey} onSelect={setAccordionKey}>
                    {cycleGroups.map((group, i) => (
                        <Card key={i} className="accordion-item">
                            <div className={"custom-accordion-header d-flex"+(accordionKey === i ? '' : ' collapsed')}>
                                <HoverToolTip text={(obs.activeCycle === group && obs.cycleEnabled) ? 'Stop group cycling' : 'Start group cycling' } placement="top" delay={250}>
                                    <Button variant="link" className="ps-3 pe-3" onClick={() => handleGroupPlayPauseClick(group)}>
                                        {(obs.activeCycle === group && obs.cycleEnabled) ? (
                                            <i className="bi bi-pause-circle-fill text-info fs-4"/>
                                        ) : (
                                            <i className="bi bi-play-circle text-success fs-4"/>
                                        )}
                                    </Button>
                                </HoverToolTip>
                                {/*<Button variant="link" className="ps-3 pe-3"><i className="bi bi-pause-circle-fill text-info fs-4"></i></Button>*/}
                                <CustomToggle className={"fw-bold fs-4"+ (accordionKey === i ? '' : ' collapsed')} eventKey={i}>{group.name}</CustomToggle>
                            </div>
                            <Accordion.Collapse eventKey={i}>
                                <Card.Body className="bg-darker">
                                    <DragDropContext onDragEnd={event => handleDragScene(event, group, i)}>
                                        <SceneGroupDroppable group={group} groupIndex={i} />
                                    </DragDropContext>
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <div>
                                            <HoverToolTip text="Add a scene to the group" placement="top" delay={250}>
                                                <Button onClick={() => handleAddNewScene(group)}><i className="bi bi-plus-circle"/> <span className="d-none d-sm-inline">Add Scene</span></Button>
                                            </HoverToolTip>
                                            <HoverToolTip text="Edit group" placement="top" delay={250}>
                                                <Button variant="secondary" className="ms-3" onClick={() => handleRenameSceneGroup(group)}><i className="bi bi-pencil-fill"/></Button>
                                            </HoverToolTip>
                                            <HoverToolTip text="Remove scene group" placement="top" delay={250}>
                                                <Button variant="danger" className="ms-3" onClick={() => handleDeleteGroup(group)}><i
                                                        className="bi bi-trash3-fill"/></Button>
                                            </HoverToolTip>
                                        </div>

                                        <Form.Group controlId="base-duration">
                                            <HoverToolTip text="How long a scene should be shown by default" placement="top" delay={250}>
                                                <Form.Label className="fw-semibold">Base Duration</Form.Label>
                                            </HoverToolTip>
                                            <HoverToolTip text="How long a scene should be shown by default" placement="top" delay={250}>
                                                <Form.Control
                                                    name="duration"
                                                    type="number"
                                                    className="d-inline-block ms-3"
                                                    style={{maxWidth: '5rem'}}
                                                    value={group.duration}
                                                    onChange={(e) => handleUpdateSceneDuration(e, group)}
                                                    min={0}
                                                />
                                            </HoverToolTip>
                                        </Form.Group>
                                    </div>
                                </Card.Body>
                            </Accordion.Collapse>
                        </Card>
                    ))}

                </Accordion>
            )}
            <SceneCycleEditModal onClose={handleEditGroupClose}
                                 show={showEditModal && editingGroup}
                                 sceneCycleGroup={editingGroup}
            />
        </Container>
    );
}

function CustomToggle({ children, eventKey, className="" }) {
    const decoratedOnClick = useAccordionButton(eventKey);

    return (
        <button
            type="button"
            className={'accordion-button ps-0 ' + className}
            onClick={decoratedOnClick}
        >
            {children}
        </button>
    );
}