import {Button} from "react-bootstrap";
import {setScene} from "./OBSActions";
import {useDispatch, useSelector} from "react-redux";


export default function OBSSceneButtons() {
    const obs = useSelector(state => state.obs);
    const dispatch = useDispatch();
    return (
        <div className="obs-scene-buttons">
            {obs.scenes.sort((a, b) => b.sceneIndex - a.sceneIndex).map((scene, i) => (
                <Button size="sm"
                        variant={scene.sceneName === obs.currentProgramSceneName ? "primary" : "secondary"}
                        key={i}
                        onClick={() => dispatch(setScene(scene.sceneName))}
                        className={scene.sceneName === obs.currentProgramSceneName ? 'current' : ''}
                >
                    {scene.sceneName}
                </Button>
            ))}
        </div>
    );
}