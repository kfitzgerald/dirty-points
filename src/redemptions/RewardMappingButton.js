import {Button} from "react-bootstrap";
import {convertStringMapping} from "./RewardUtil";
import HoverToolTip from "../common/HoverToolTip";

export default function RewardMappingButton({ reward, mapping, onClick }) {

    let mappingDescription;
    let mappingStatus = 'text-secondary'; // not set

    if (mapping) {
        if (typeof mapping === 'string') mapping = convertStringMapping(mapping);

        if (mapping.sceneName && mapping.sceneItems.length === 0) {
            mappingDescription = <><i className="bi bi-image-fill"/> {mapping.sceneName}</>;
            mappingStatus = 'text-success';
        } else if (mapping.sceneName && mapping.sceneItems.length > 0) {
            mappingDescription = <><i className="bi bi-toggles"/> {mapping.sceneName} ({mapping.sceneItems.length} items)</>;
            mappingStatus = 'text-success';
        } else {
            mappingDescription = <em data-id={reward.id}>(not mapped correctly)</em>;
            mappingStatus = 'text-warning';
        }

    } else {
        mappingDescription = <em data-id={reward.id}>(not set)</em>;
    }

    return (
        <HoverToolTip text="Manage OBS reward mappings" placement="top" delay={250}>
            <Button data-id={reward.id}
                    variant="link"
                    className={`text-start ps-0 pe-0 ${mappingStatus}`}
                    onClick={onClick}
            >{mappingDescription}</Button>
        </HoverToolTip>
    )
}