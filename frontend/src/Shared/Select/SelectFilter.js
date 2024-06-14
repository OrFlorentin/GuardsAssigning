import React from 'react';
import SelectMenu from '../SelectMenu';
import MenuItem from '@mui/material/MenuItem';

export default function SelectFilter({
    objects,
    currentObject,
    setCurrentObject,
    title,
    allObjectsTitle,
}) {
    const onSelectChange = (event) => {
        setCurrentObject(event.target.value);
    };

    return (
        <SelectMenu title={title} value={currentObject} onSelectChange={onSelectChange}>
            {allObjectsTitle && (
                <MenuItem value={null}>
                    <em>{allObjectsTitle}</em>
                </MenuItem>
            )}
            {objects.map((object, index) => (
                <MenuItem key={index} value={object._id}>
                    {object.name}
                </MenuItem>
            ))}
        </SelectMenu>
    );
}
