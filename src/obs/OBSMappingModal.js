import {Button, Form, Modal, Col, Row, Accordion, Badge} from "react-bootstrap";
import {useCallback, useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import Select from 'react-select';
import {deleteRedemptionMapping, setRedemptionMapping} from "../redemptions/RedemptionActions";
import {convertStringMapping, getEmptyMapping, getMappingType} from "../redemptions/RewardUtil";
import {OBSSceneItemsPicker} from "./OBSSceneItemsPicker";
import {CHAT_BADGES, MAPPING_TYPES} from "../common/Constants";
import HoverToolTip from "../common/HoverToolTip";
import {OBSSourceFiltersPicker} from "./OBSSourceFiltersPicker";

export default function OBSMappingModal({ show, onClose, reward=null }) {
    const dispatch = useDispatch();
    const redemptions = useSelector(state => state.redemptions);
    const obs = useSelector(state => state.obs);
    const [ desiredType, setDesiredType ] = useState(null);

    useEffect(() => {
        setDesiredType(null);
    }, [reward, show]);

    // console.log(mapping)

    // Current mapping for this
    const { mappings } = redemptions;
    let mapping = reward && mappings[reward.id];

    if (typeof mapping === "string") mapping = convertStringMapping(mapping);

    if (!mapping) {
        mapping = getEmptyMapping();
    }

    const handleUpdateSceneName = useCallback((value) => {
        // dispatch action
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            sceneName: value?.value || null,
            sceneItems: []
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateTimeoutSceneName = useCallback((value) => {
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            timeoutScene: value?.value || null
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateSceneItems = useCallback((value) => {
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            sceneItems: value.map(o => o.value)
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateChatCommandBadges = useCallback((value) => {
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            chatCommandBadges: value.map(o => o.value)
        }));
    }, [dispatch, reward, mapping]);

    const handleAddSecondaryItem = useCallback((item) => {
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            secondaryItems: (mapping.secondaryItems||[]).concat(item)
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateSecondaryItem = useCallback((item, data) => {
        const secondaryItems = mapping.secondaryItems || [];
        const index = secondaryItems.findIndex(i => i === item);
        if (index < 0) return;
        secondaryItems[index] = data;
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            secondaryItems
        }));
    }, [dispatch, reward, mapping]);

    const handleDeleteSecondaryItem = useCallback((item) => {
        const secondaryItems = mapping.secondaryItems || [];
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            secondaryItems: secondaryItems.filter( i => i !== item)
        }));
    }, [dispatch, reward, mapping]);

    const handleAddSourceFilter = useCallback((item) => {
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            sourceFilters: (mapping.sourceFilters||[]).concat(item)
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateSourceFilter = useCallback((item, data) => {
        const sourceFilters = mapping.sourceFilters || [];
        const index = sourceFilters.findIndex(i => i === item);
        if (index < 0) return;
        sourceFilters[index] = data;
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            sourceFilters
        }));
    }, [dispatch, reward, mapping]);

    const handleDeleteSourceFilter = useCallback((item) => {
        const sourceFilters = mapping.sourceFilters || [];
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            sourceFilters: sourceFilters.filter( i => i !== item)
        }));
    }, [dispatch, reward, mapping]);

    const handleTimeoutChange = useCallback((e) => {
        // dispatch action
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            timeout: parseFloat(e.target.value || 0)
        }));
    }, [dispatch, reward, mapping]);

    const handleUpdateChatCommand = useCallback((e) => {
        // dispatch action
        dispatch(setRedemptionMapping(reward.id, {
            ...mapping,
            chatCommand: e.target.value.trim() || null
        }));
    }, [dispatch, reward, mapping]);

    const chatBadgeOptions = Array.from(Object.entries(CHAT_BADGES)).map(([key, value]) => {
        return {
            value: value,
            label: key
        };
    });

    const sceneOptions = obs.scenes.sort((a, b) => b.sceneIndex - a.sceneIndex).map((scene) => {
        return {
            value: scene.sceneName,
            label: scene.sceneName
        }
    });

    const sceneItemOptions = (mapping.sceneName && obs.sceneItems[mapping.sceneName]) ? obs.sceneItems[mapping.sceneName].sort((a, b) => b.sceneItemIndex - a.sceneItemIndex).map((sceneItem) => {
        return {
            value: sceneItem.sceneItemId,
            label: sceneItem.sourceName
        }
    }) : [];

    const handleDelete = useCallback(() => {
        dispatch(deleteRedemptionMapping(reward.id));
        onClose();
    }, [dispatch, onClose, reward])

    const mappingType = desiredType || getMappingType(mapping);

    const handleTypeChange = useCallback((eventKey) => {
        setDesiredType(eventKey)
    }, [dispatch])

    const beforeClose = useCallback(() => {
        // clean up properties based on desired type
        console.log('cleanup')
        switch (desiredType) {

            case MAPPING_TYPES.FILTER_TOGGLE:
                dispatch(setRedemptionMapping(reward.id, {
                    ...mapping,
                    sceneName: null,
                    sceneItems: [],
                    secondaryItems: []
                }));
                break;

            case MAPPING_TYPES.SCENE_CHANGE:
                dispatch(setRedemptionMapping(reward.id, {
                    ...mapping,
                    sceneItems: [],
                    secondaryItems: [],
                    sourceFilters: []
                }));
                break;

            case MAPPING_TYPES.SOURCE_TOGGLE:
                dispatch(setRedemptionMapping(reward.id, {
                    ...mapping,
                    sourceFilters: []
                }));
                break;
        }

        onClose();
    }, [desiredType, onClose, dispatch, reward, mapping])

    // Types of mappings
    // - scene ----> redeem=show, timeout=(nothing, scene)
    // - item(s) --> redeem=show, timeout=hide
    // - filter(s)-> redeem=show, timeout=hide

    // fields
    // - sceneName: 'name',
    // - sceneItems: [],
    // - timeout: 0,
    // - timeoutScene: 'sceneName',
    // - chatCommand: '!lineup',
    // - chatCommandBadges: [ 'broadcaster' ... ],
    // - secondaryItems: [ { sceneItems: [], sceneName: '' } ... ]
    // - sourceFilters: [ { sourceName: '', filterNames: [ '' ... ]] } ... ]

    const secondaryItems = (mapping.secondaryItems || []);
    const sourceFilters = (mapping.sourceFilters || []);

    return (
        <>
            <Modal show={show} onHide={onClose}>
                <Form>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Reward OBS Action
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>

                        <Form.Label className="fw-semibold">Choose action type</Form.Label>
                        <Accordion style={{
                            marginLeft: 'calc(var(--bs-modal-padding)*-1)',
                            marginRight: 'calc(var(--bs-modal-padding)*-1)',
                        }} className="mb-3" activeKey={mappingType} onSelect={handleTypeChange}>

                            <Accordion.Item eventKey={MAPPING_TYPES.SCENE_CHANGE}>
                                <Accordion.Header><i className="bi bi-image-fill text-primary d-inline-block me-2" />&nbsp;Change Scene</Accordion.Header>
                                <Accordion.Body>
                                    <Form.Group controlId="sceneName" className="mb-3">
                                        <Form.Label className="fw-semibold">OBS Scene</Form.Label>
                                        <Select
                                            name="sceneName"
                                            unstyled
                                            isClearable
                                            classNamePrefix="react-select"
                                            classNames={{
                                                container: () => `form-control`,
                                                option: () => 'dropdown-item',
                                                menuList: () => 'dropdown-menu show'
                                            }}
                                            options={sceneOptions}
                                            value={sceneOptions.find(o => o.value === mapping.sceneName)}
                                            onChange={handleUpdateSceneName}
                                        />
                                    </Form.Group>
                                    <Row>
                                        <Form.Group as={Col} xs={4} controlId="timeout" className="mb-3">
                                            <Form.Label className="fw-semibold">Duration (s)</Form.Label>
                                            <HoverToolTip text="Time in seconds before changing scene" placement="top" delay={250}>
                                                <Form.Control
                                                    name="timeout"
                                                    type="number"
                                                    value={mapping.timeout}
                                                    onChange={handleTimeoutChange}
                                                    min={0}
                                                    style={{
                                                        maxWidth: '10em',
                                                        padding: '.75rem'
                                                    }}
                                                />
                                            </HoverToolTip>
                                        </Form.Group>
                                        <Form.Group as={Col} xs={8} controlId="timeoutScene" className="mb-3">
                                            <HoverToolTip text="Scene to switch to on timeout" placement="top" delay={250}>
                                                <Form.Label className="fw-semibold">Scene on Timeout</Form.Label>
                                            </HoverToolTip>
                                            <Select
                                                name="timeoutScene"
                                                unstyled
                                                isClearable
                                                classNamePrefix="react-select"
                                                classNames={{
                                                    container: () => `form-control`,
                                                    option: () => 'dropdown-item',
                                                    menuList: () => 'dropdown-menu show'
                                                }}
                                                options={sceneOptions}
                                                value={sceneOptions.find(o => o.value === mapping.timeoutScene)}
                                                onChange={handleUpdateTimeoutSceneName}
                                            />
                                        </Form.Group>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey={MAPPING_TYPES.SOURCE_TOGGLE}>
                                <Accordion.Header><i className="bi bi-toggles text-primary d-inline-block me-2" />&nbsp;Toggle Sources On → Off</Accordion.Header>
                                <Accordion.Body>
                                    <Form.Group controlId="sceneName" className="mb-3">
                                        <Form.Label className="fw-semibold">OBS Scene</Form.Label>
                                        <Select
                                            name="sceneName"
                                            unstyled
                                            isClearable
                                            classNamePrefix="react-select"
                                            classNames={{
                                                container: () => `form-control`,
                                                option: () => 'dropdown-item',
                                                menuList: () => 'dropdown-menu show'
                                            }}
                                            options={sceneOptions}
                                            value={sceneOptions.find(o => o.value === mapping.sceneName)}
                                            onChange={handleUpdateSceneName}
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="sceneItems" className="mb-3">
                                        <Form.Label className="fw-semibold">Scene Sources</Form.Label>
                                        <Select
                                            name="sceneItems"
                                            classNamePrefix="react-select"
                                            isMulti
                                            unstyled
                                            classNames={{
                                                container: () => `form-control`,
                                                option: () => 'dropdown-item',
                                                menuList: () => 'dropdown-menu show'
                                            }}
                                            options={sceneItemOptions}
                                            value={sceneItemOptions.filter(o => mapping.sceneItems.includes(o.value))}
                                            onChange={handleUpdateSceneItems}
                                        />
                                        {/*<Form.Text>When scene sources are selected, they will be shown on redeem and hidden on timeout</Form.Text>*/}
                                    </Form.Group>
                                    <Accordion style={{
                                        // marginLeft: 'calc(var(--bs-modal-padding)*-1)',
                                        // marginRight: 'calc(var(--bs-modal-padding)*-1)',
                                    }} className="mb-3">
                                        <Accordion.Header>Sources on other scenes... <Badge className="ms-3">{secondaryItems.length > 0 ? secondaryItems.length : ''}</Badge></Accordion.Header>
                                        <Accordion.Body className="bg-darker">
                                            <OBSSceneItemsPicker onAdd={handleAddSecondaryItem} />
                                            <hr />
                                            {secondaryItems.map((item, i) => (
                                                <OBSSceneItemsPicker onChange={handleUpdateSecondaryItem}
                                                                     key={i}
                                                                     onDelete={handleDeleteSecondaryItem}
                                                                     secondaryMapping={item}
                                                />
                                            ))}
                                        </Accordion.Body>
                                    </Accordion>
                                    <Row>
                                        <Form.Group as={Col} xs={4} controlId="timeout" className="mb-3">
                                            <Form.Label className="fw-semibold">Duration (s)</Form.Label>
                                            <HoverToolTip text="Time in seconds before hiding sources" placement="top" delay={250}>
                                                <Form.Control
                                                    name="timeout"
                                                    type="number"
                                                    value={mapping.timeout}
                                                    onChange={handleTimeoutChange}
                                                    min={0}
                                                    style={{
                                                        maxWidth: '10em',
                                                        padding: '.75rem'
                                                    }}
                                                />
                                            </HoverToolTip>
                                        </Form.Group>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>

                            <Accordion.Item eventKey={MAPPING_TYPES.FILTER_TOGGLE}>
                                <Accordion.Header><i className="bi bi-eye-slash-fill text-primary d-inline-block me-2" />&nbsp;Toggle Source Filters On → Off</Accordion.Header>
                                <Accordion.Body>
                                    <OBSSourceFiltersPicker onAdd={handleAddSourceFilter} />
                                    <hr />
                                    {sourceFilters.map((item, i) => (
                                        <OBSSourceFiltersPicker onChange={handleUpdateSourceFilter}
                                                             key={i}
                                                             onDelete={handleDeleteSourceFilter}
                                                             sourceFilter={item}
                                        />
                                    ))}
                                    <Row>
                                        <Form.Group as={Col} xs={4} controlId="timeout" className="mb-3">
                                            <Form.Label className="fw-semibold">Duration (s)</Form.Label>
                                            <HoverToolTip text="Time in seconds before hiding sources" placement="top" delay={250}>
                                                <Form.Control
                                                    name="timeout"
                                                    type="number"
                                                    value={mapping.timeout}
                                                    onChange={handleTimeoutChange}
                                                    min={0}
                                                    style={{
                                                        maxWidth: '10em',
                                                        padding: '.75rem'
                                                    }}
                                                />
                                            </HoverToolTip>
                                        </Form.Group>
                                    </Row>
                                </Accordion.Body>
                            </Accordion.Item>

                        </Accordion>

                        <Row>
                            <Form.Group as={Col} controlId="chatCommand" className="mb-3">
                                <Form.Label className="fw-semibold">Chat Command / Text</Form.Label>
                                <HoverToolTip text="Optionally trigger the redemption via chat command" placement="top" delay={250}>
                                    <Form.Control
                                        name="prompt"
                                        value={mapping.chatCommand}
                                        style={{
                                            padding: '.75rem'
                                        }}
                                        placeholder={"e.g. !lineup"}
                                        onChange={handleUpdateChatCommand}
                                        type="text"
                                    />
                                </HoverToolTip>
                            </Form.Group>
                            <Form.Group as={Col} controlId="chatCommandBadges" className="mb-3">
                                <HoverToolTip text="Limit chat redemptions to users with the given badges" placement="top" delay={250}>
                                    <Form.Label className="fw-semibold">Limit Command to</Form.Label>
                                </HoverToolTip>
                                <Select
                                    name="chatCommandBadges"
                                    classNamePrefix="react-select"
                                    isMulti
                                    unstyled
                                    classNames={{
                                        container: () => `form-control`,
                                        option: () => 'dropdown-item',
                                        menuList: () => 'dropdown-menu show'
                                    }}
                                    options={chatBadgeOptions}
                                    value={chatBadgeOptions.filter(o => (mapping.chatCommandBadges || []).includes(o.value))}
                                    onChange={handleUpdateChatCommandBadges}
                                />
                            </Form.Group>
                        </Row>

                    </Modal.Body>
                    <Modal.Footer>
                        <div className="flex-grow-1">
                            <HoverToolTip text="Remove mapping" placement="top" delay={250}>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete
                                </Button>
                            </HoverToolTip>
                        </div>
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                        <Button variant="success" onClick={beforeClose}>
                            Save
                        </Button>
                    </Modal.Footer>

                </Form>
            </Modal>
        </>
    )
}