import {Button} from "react-bootstrap";
import {getMappingType} from "./RewardUtil";
import HoverToolTip from "../common/HoverToolTip";
import {MAPPING_TYPES} from "../common/Constants";

export default function RewardMappingButton({ reward, mapping, onClick }) {

    let mappingDescription;
    let mappingStatus = 'text-secondary'; // not set

    if (mapping) {
        const type = getMappingType(mapping);
        switch (type) {
            case MAPPING_TYPES.FILTER_TOGGLE:
                mappingDescription = <><i className="bi bi-eye-slash-fill"/> Filters: {mapping.sourceFilters.reduce((a, c) => a+c.filterNames.length, 0)}</>;
                mappingStatus = 'text-success';
                break;

            case MAPPING_TYPES.SCENE_CHANGE:
                mappingDescription = <><i className="bi bi-image-fill"/> {mapping.sceneName}</>;
                mappingStatus = 'text-success';
                break;

            case MAPPING_TYPES.SOURCE_TOGGLE:
                mappingDescription = <><i className="bi bi-toggles"/> {mapping.sceneName} ({mapping.sceneItems.length} items)</>;
                mappingStatus = 'text-success';
                break;

            default:
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