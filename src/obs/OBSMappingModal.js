import {Button, Form, Modal, Col, Row, Accordion, Badge} from "react-bootstrap";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import Select from 'react-select';
import {deleteRedemptionMapping, setRedemptionMapping} from "../redemptions/RedemptionActions";
import {convertStringMapping, getEmptyMapping} from "../redemptions/RewardUtil";
import {OBSSceneItemsPicker} from "./OBSSceneItemsPicker";
import {CHAT_BADGES} from "../common/Constants";

export default function OBSMappingModal({ show, onClose, reward=null }) {
    const dispatch = useDispatch();
    const redemptions = useSelector(state => state.redemptions);
    const obs = useSelector(state => state.obs);

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

    // Types of mappings
    // - scene ---> redeem=show, timeout=(nothing, scene)
    // - item(s) -> redeem=show, timeout=hide

    // fields
    // - sceneName
    // - sceneItems[]
    // - timeout
    // - timeoutScene: sceneName
    // - chatCommand

    const secondaryItems = (mapping.secondaryItems || []);

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

                        <Form.Group controlId="sceneName" className="mb-3">
                            <Form.Label className="fw-semibold">OBS Scene</Form.Label>
                            <Select
                                name="sceneName"
                                unstyled={true}
                                isClearable={true}
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
                            <Form.Label className="fw-semibold">Scene Items</Form.Label>
                            <Select
                                name="sceneItems"
                                classNamePrefix="react-select"
                                isMulti={true}
                                unstyled={true}
                                classNames={{
                                    container: () => `form-control`,
                                    option: () => 'dropdown-item',
                                    menuList: () => 'dropdown-menu show'
                                }}
                                options={sceneItemOptions}
                                value={sceneItemOptions.filter(o => mapping.sceneItems.includes(o.value))}
                                onChange={handleUpdateSceneItems}
                            />
                            <Form.Text>When scene sources are selected, they will be shown on redeem and hidden on timeout</Form.Text>
                        </Form.Group>
                        <Accordion style={{
                            marginLeft: 'calc(var(--bs-modal-padding)*-1)',
                            marginRight: 'calc(var(--bs-modal-padding)*-1)',
                        }} className="mb-3">
                            <Accordion.Header>Items on other scenes... <Badge className="ms-3">{secondaryItems.length > 0 ? secondaryItems.length : ''}</Badge></Accordion.Header>
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
                                <Form.Label className="fw-semibold">Timeout (s)</Form.Label>
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
                            </Form.Group>
                            <Form.Group as={Col} xs={8} controlId="timeoutScene" className="mb-3">
                                <Form.Label className="fw-semibold">Scene on Timeout</Form.Label>
                                <Select
                                    name="timeoutScene"
                                    unstyled={true}
                                    isClearable={true}
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
                        <Row>
                            <Form.Group as={Col} controlId="chatCommand" className="mb-3">
                                <Form.Label className="fw-semibold">Chat Command / Text</Form.Label>
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
                            </Form.Group>
                            <Form.Group as={Col} controlId="chatCommandBadges" className="mb-3">
                                <Form.Label className="fw-semibold">Limit Command to</Form.Label>
                                <Select
                                    name="chatCommandBadges"
                                    classNamePrefix="react-select"
                                    isMulti={true}
                                    unstyled={true}
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
                            <Button variant="danger" onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                        <Button variant="secondary" onClick={onClose}>
                            Close
                        </Button>
                    </Modal.Footer>

                </Form>
            </Modal>
        </>
    )
}