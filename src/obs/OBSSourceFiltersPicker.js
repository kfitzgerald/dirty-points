import {Button, Col, Form, Row} from "react-bootstrap";
import {useSelector} from "react-redux";
import Select from "react-select";
import {useCallback, useEffect, useState} from "react";

export function OBSSourceFiltersPicker({ sourceFilter = null, onAdd=null, onChange=null, onDelete=null }) {
    const { sourceName, filterNames } = (sourceFilter || {
        sourceName: null,
        filterNames: []
    });
    const obs = useSelector(state => state.obs);

    const [ currentSourceName, setCurrentSourceName ] = useState(sourceName);
    const [ currentFilterNames, setCurrentFilterNames ] = useState([...filterNames]);

    useEffect(() => {
        setCurrentSourceName(sourceFilter?.sourceName);
        setCurrentFilterNames([...(sourceFilter?.filterNames || [])]);
    }, [sourceFilter]);

    const sourcesWithFilters = Object.keys(obs.filters).filter(k => obs.filters[k].length > 0).sort();
    const sourceOptions = sourcesWithFilters.map((sourceName) => {
        return {
            value: sourceName,
            label: sourceName
        }
    });

    const filterOptions = (currentSourceName && obs.filters[currentSourceName]) ? obs.filters[currentSourceName].map((filter) => {
        return {
            value: filter.filterName,
            label: filter.filterName
        }
    }) : [];

    const handleUpdateSourceName = useCallback((value) => {
        // dispatch action
        setCurrentSourceName(value?.value || null);
        setCurrentFilterNames([]);
        onChange && onChange(sourceFilter, {
            sourceName: value?.value || null,
            filterNames: []
        });
    }, [sourceFilter, onChange]);

    const handleUpdateSourceFilters = useCallback((value) => {
        // dispatch action
        const filterNames = value.map(o => o.value);
        setCurrentFilterNames(filterNames);
        onChange && onChange(sourceFilter, {
            sourceName: currentSourceName,
            filterNames
        });
    }, [sourceFilter, currentSourceName, onChange]);

    const handleDelete = useCallback(() => {
        onDelete && onDelete(sourceFilter);
    }, [onDelete, sourceFilter]);

    const handleAdd = useCallback(() => {
        if (currentSourceName && currentFilterNames && currentFilterNames.length > 0) {
            onAdd && onAdd({
                sourceName: currentSourceName,
                filterNames: currentFilterNames
            })
        }
    }, [onAdd, currentSourceName, currentFilterNames]);

    return (
        <Row>
            <Form.Group as={Col} xs={5} controlId="sourceName" className="mb-3">
                <Form.Label className="fw-semibold">Source</Form.Label>
                <Select
                    name="sourceName"
                    unstyled
                    isClearable
                    classNamePrefix="react-select"
                    classNames={{
                        container: () => `form-control`,
                        option: () => 'dropdown-item',
                        menuList: () => 'dropdown-menu show'
                    }}
                    options={sourceOptions}
                    value={sourceOptions.find(o => o.value === currentSourceName)}
                    onChange={handleUpdateSourceName}
                />
            </Form.Group>
            <Form.Group as={Col} xs={6} controlId="filterNames" className="mb-3">
                <Form.Label className="fw-semibold">Filters</Form.Label>
                <Select
                    name="filterNames"
                    classNamePrefix="react-select"
                    isMulti
                    unstyled
                    classNames={{
                        container: () => `form-control`,
                        option: () => 'dropdown-item',
                        menuList: () => 'dropdown-menu show'
                    }}
                    options={filterOptions}
                    value={filterOptions.filter(o => currentFilterNames.includes(o.value))}
                    onChange={handleUpdateSourceFilters}
                />
            </Form.Group>
            <Col xs={1} className="ps-0 pe-0 scene-item-picker-actions">
                <Form.Label className="fw-semibold w-100">&nbsp;</Form.Label>
                {onDelete && <Button variant="link" onClick={handleDelete} className="text-danger"><i className="bi bi-x-circle-fill"/></Button>}
                {onAdd && <Button variant="link" onClick={handleAdd} className="text-success"><i className="bi bi-plus-circle-fill"/></Button>}
            </Col>
        </Row>
    );
}