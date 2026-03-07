import {Overlay, Tooltip} from "react-bootstrap";
import propTypes from "prop-types";
import React, {useEffect, useRef, useState} from "react";
import ClipboardJS from "clipboard";

export default function CopyElement({ Component, value, children, ...props }) {

    const ref = useRef(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (ref.current) {
            const clipboard = new ClipboardJS(ref.current);
            let timeoutHandle;
            clipboard.on('success', () => {
                setCopied(true);
                timeoutHandle = setTimeout(() => {
                    setCopied(false);
                }, 2000);
            });
            return () => {
                clipboard.destroy();
                clearTimeout(timeoutHandle);
            };
        }
    }, [ref, setCopied]);

    return (
        <>
            <Component data-clipboard-text={value} ref={ref} {...props}>{children}</Component>
            <Overlay target={ref.current} show={copied} placement="auto" flip>
                <Tooltip id="copied-tooltip">
                    Copied
                </Tooltip>
            </Overlay>
        </>
    );
}

CopyElement.propTypes = {
    value: propTypes.string,
    children: propTypes.any
};
