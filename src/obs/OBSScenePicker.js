import {Form} from "react-bootstrap";
import {useSelector} from "react-redux";

export function OBSScenePicker({ scene, onChange }) {
    const scenes = useSelector(state => state.obs.scenes);

    return (
        <Form.Select onChange={onChange} value={!scene ? '-' : scene}>
            <option value="-">-</option>
            {scenes.sort((a, b) => b.sceneIndex - a.sceneIndex).map((scene, i) => (
                <option key={i} data-index={scene.sceneIndex} value={scene.sceneName}>{scene.sceneName}</option>
            ))}
        </Form.Select>
    );
}