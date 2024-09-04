import {useCallback, useEffect, useState} from "react";
import {Button, Form, ListGroup} from "react-bootstrap";
import {Draggable, Droppable} from "react-beautiful-dnd";
import {OBSScenePicker} from "./OBSScenePicker";
import {useDispatch, useSelector} from "react-redux";
import {deleteSceneCycleItem, updateSceneCycleItem} from "./OBSActions";
import './OBS.scss';

export default function SceneGroupDroppable({ group, groupIndex }) {
    const [ enabled, setEnabled ] = useState(false);
    const currentProgramSceneName = useSelector(state => state.obs.currentProgramSceneName);
    const dispatch = useDispatch();

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));

        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    const handleSceneNameChange = useCallback((value, group, scene) => {
        dispatch(updateSceneCycleItem(group, scene, {
            ...scene,
            sceneName: value.target.value || null
        }));
    }, [dispatch]);

    const handleSceneToggle = useCallback((event, group, scene) => {
        dispatch(updateSceneCycleItem(group, scene, {
            ...scene,
            enabled: event.target.checked
        }));
    }, [dispatch]);

    const handleSceneDurationChange = useCallback((value, group, scene) => {
        dispatch(updateSceneCycleItem(group, scene, {
            ...scene,
            duration: parseFloat(value.target.value || 0)
        }));
    }, [dispatch]);

    const handleDeleteSceneFromGroup = useCallback((group, scene) => {
        dispatch(deleteSceneCycleItem(group, scene));
    }, [dispatch]);

    if (!enabled) {
        return null;
    }

    // console.log('render')


    return (
        <Droppable droppableId={`group-${groupIndex}-droppable`}>
            {(droppableProvided/*, snapshot*/) => (
                <ListGroup
                    {...droppableProvided.droppableProps}
                    ref={droppableProvided.innerRef}
                    key="scene-list-group"
                    id={`group-${groupIndex}-droppable`}
                >
                    {group.scenes.map((scene, sceneIndex) => (
                        <Draggable key={sceneIndex}
                                   draggableId={`group-${groupIndex}-scene-${sceneIndex}`}
                                   index={sceneIndex}
                        >
                            {(draggableProvided/*, snapshot*/) => (
                                <ListGroup.Item
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                    id={`group-${groupIndex}-scene-${sceneIndex}`}
                                    data-index={sceneIndex}
                                    className={`draggable-scene-list ${currentProgramSceneName === scene.sceneName ? 'scene-active' : ''}`}
                                >
                                    <div className="handle">
                                        <i className="bi bi-grip-horizontal"/>
                                    </div>
                                    <Form.Check type="switch"
                                                checked={scene.enabled}
                                                onChange={(event) => handleSceneToggle(event, group, scene)}/>
                                    <OBSScenePicker scene={scene.sceneName}
                                                    onChange={value => handleSceneNameChange(value, group, scene)}/>
                                    <Form.Control
                                        name="duration"
                                        type="number"
                                        value={scene.duration || 0}
                                        onChange={value => handleSceneDurationChange(value, group, scene)}
                                        min={0}
                                    />
                                    <Button variant="danger" onClick={() => handleDeleteSceneFromGroup(group, scene)} className="me-2">
                                        <i className="bi bi-trash3-fill"/>
                                    </Button>
                                </ListGroup.Item>
                            )}
                        </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                </ListGroup>
            )}
        </Droppable>
    );
}