import {Button} from "react-bootstrap";
import {setScene} from "./OBSActions";
import {useDispatch, useSelector} from "react-redux";
import FilterTextBox from "../common/FilterTextBox";


export default function OBSSceneButtons() {
    const obs = useSelector(state => state.obs);
    const dispatch = useDispatch();
    return (
            <FilterTextBox items={obs.scenes.sort((a, b) => b.sceneIndex - a.sceneIndex)}
                           filterItem={(filter, item) => item.sceneName.toLowerCase().indexOf(filter.toLowerCase()) >= 0}
                           render={(items) => (
                               <div className="obs-scene-buttons">
                                   {items.map((scene, i) => (
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
                           )}
                           label="Filter Scenes"
                           controlId="obs_scene_filter"
               />

    );
}