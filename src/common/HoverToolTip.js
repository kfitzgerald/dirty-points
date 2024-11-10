import propTypes from "prop-types";
import {OverlayTrigger, Tooltip} from "react-bootstrap";

export default function HoverToolTip({ text,  children, ...overlayProps }) {
    return (
        <OverlayTrigger
            {...overlayProps}
            overlay={
                <Tooltip>
                    {text}
                </Tooltip>
            }
        >
            {children}
        </OverlayTrigger>
    );
}

HoverToolTip.propTypes = {
    text: propTypes.any.isRequired,
    children: propTypes.any.isRequired
};
