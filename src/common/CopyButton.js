import {Button} from "react-bootstrap";
import propTypes from "prop-types";
import React from "react";
import CopyElement from "./CopyElement";


export default function CopyButton({ value, children, ...buttonProps }) {
    return (
        <CopyElement Component={Button} value={value} {...buttonProps}>{children}</CopyElement>
    )
}

CopyButton.propTypes = {
    value: propTypes.string,
    children: propTypes.any
};
