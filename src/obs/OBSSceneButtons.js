import {Button} from "react-bootstrap";
import {setScene} from "./OBSActions";
import {useDispatch, useSelector} from "react-redux";
import FilterTextBox from "../common/FilterTextBox";


export default function OBSSceneButtons() {
    const scenes = useSelector(state => state.obs.scenes);
    const currentProgramSceneName = useSelector(state => state.obs.currentProgramSceneName);
    const dispatch = useDispatch();
    return (
            <FilterTextBox items={scenes.sort((a, b) => b.sceneIndex - a.sceneIndex)}
                           filterItem={(filter, item) => item.sceneName.toLowerCase().indexOf(filter.toLowerCase()) >= 0}
                           render={(items) => (
                               <div className="obs-scene-buttons">
                                   {items.map((scene, i) => (
                                       <Button size="sm"
                                               variant={scene.sceneName === currentProgramSceneName ? "primary" : "secondary"}
                                               key={i}
                                               onClick={() => dispatch(setScene(scene.sceneName))}
                                               className={scene.sceneName === currentProgramSceneName ? 'current' : ''}
                                       >
                                           {scene.sceneName}
                                       </Button>
                                   ))}
                               </div>
                           )}
                           label="Filter Scenes"
                           controlId="obs_scene_filter"
               />

    );
}