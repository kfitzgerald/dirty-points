import {Form, Row} from "react-bootstrap";
import {useCallback, useEffect, useRef, useState} from "react";


export default function FilterTextBox({ items, filterItem, render, label="Filter", controlId="filter", timeout=500 }) {

    const [ value, setValue ] = useState("");
    const timeoutRef = useRef(null);
    const [ filter, setFilter ] = useState("");

    const handleChange = useCallback((e) => {
        setValue(e.target.value);
    },[setValue]);

    useEffect(() => {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setFilter(value.trim());
        }, timeout);
    }, [value, timeout]);


    let filteredItems = items;
    if (filter) {
        filteredItems = items
            .filter(i => filterItem(filter, i))
        ;
    }

    return (
        <>
            <Row>
                <Form.Group controlId={controlId} className="mb-3">
                    <Form.Label className="fw-semibold">{label}</Form.Label>
                    <Form.Control
                        name={controlId}
                        type="text"
                        value={value}
                        onChange={handleChange}
                    />
                </Form.Group>
            </Row>
            {render(filteredItems)}
        </>
    );
}