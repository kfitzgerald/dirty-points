import {Button, Col, Form, Row} from "react-bootstrap";
import {useSelector} from "react-redux";
import Select from "react-select";
import {useCallback, useEffect, useState} from "react";

export function OBSSceneItemsPicker({ secondaryMapping = null, onAdd=null, onChange=null, onDelete=null }) {
    const { scene, sceneItems } = (secondaryMapping || {
        scene: null,
        sceneItems: []
    });
    const obs = useSelector(state => state.obs);

    const [ currentScene, setCurrentScene ] = useState(scene);
    const [ currentItems, setCurrentItems ] = useState([...sceneItems]);

    useEffect(() => {
        setCurrentScene(secondaryMapping?.sceneName);
        setCurrentItems([...(secondaryMapping?.sceneItems || [])]);
    }, [secondaryMapping]);

    const sceneOptions = obs.scenes.sort((a, b) => b.sceneIndex - a.sceneIndex).map((scene) => {
        return {
            value: scene.sceneName,
            label: scene.sceneName
        }
    });

    const sceneItemOptions = (currentScene && obs.sceneItems[currentScene]) ? obs.sceneItems[currentScene].sort((a, b) => b.sceneItemIndex - a.sceneItemIndex).map((sceneItem) => {
        return {
            value: sceneItem.sceneItemId,
            label: sceneItem.sourceName
        }
    }) : [];

    const handleUpdateSceneName = useCallback((value) => {
        // dispatch action
        setCurrentScene(value?.value || null);
        setCurrentItems([]);
        onChange && onChange(secondaryMapping, {
            sceneName: value?.value || null,
            sceneItems: []
        });
    }, [secondaryMapping, onChange]);

    const handleUpdateSceneItems = useCallback((value) => {
        // dispatch action
        const items = value.map(o => o.value);
        setCurrentItems(items);
        onChange && onChange(secondaryMapping, {
            sceneName: currentScene,
            sceneItems: items
        });
    }, [secondaryMapping, currentScene, onChange]);

    const handleDelete = useCallback(() => {
        onDelete && onDelete(secondaryMapping);
    }, [onDelete, secondaryMapping]);

    const handleAdd = useCallback(() => {
        if (currentScene && currentItems && currentItems.length > 0) {
            onAdd && onAdd({
                sceneName: currentScene,
                sceneItems: currentItems
            })
        }
    }, [onAdd, currentScene, currentItems]);

    // if (secondaryMapping) {
    //     console.log('render', { secondaryMapping, currentScene, currentItems })
    // }

    return (
        <Row>
            <Form.Group as={Col} xs={5} controlId="sceneName" className="mb-3">
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
                    value={sceneOptions.find(o => o.value === currentScene)}
                    onChange={handleUpdateSceneName}
                />
            </Form.Group>
            <Form.Group as={Col} xs={6} controlId="sceneItems" className="mb-3">
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
                    value={sceneItemOptions.filter(o => currentItems.includes(o.value))}
                    onChange={handleUpdateSceneItems}
                />
            </Form.Group>
            <Col xs={1} className="ps-0 pe-0 scene-item-picker-actions">
                <Form.Label className="fw-semibold w-100">&nbsp;</Form.Label>
                {onDelete && <Button variant="link" onClick={handleDelete} className="text-danger"><i className="bi bi-x-circle-fill"/></Button>}
                {onAdd && <Button variant="link" onClick={handleAdd} className="text-success"><i className="bi bi-plus-circle-fill"/></Button>}
            </Col>
        </Row>
    );
}