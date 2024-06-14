import { MenuItem } from '@mui/material';
import React from 'react';
import { useAppContext } from '../AppContext';
import SelectMenu from '../SelectMenu';

export default function PopulationTypeSelect() {
    const { populationTypes, setFilteredPopulationType, filteredPopulationType } = useAppContext();

    const onSelectChange = (event) => {
        setFilteredPopulationType(event.target.value);
    };

    return (
        <SelectMenu title={"אוכלוסייה"} value={filteredPopulationType} onSelectChange={onSelectChange}>
            {(
                <MenuItem value={null}>
                    <em>{"כל האוכלוסיות"}</em>
                </MenuItem>
            )}
            {populationTypes.map((object, index) => (
                <MenuItem key={index} value={object}>
                    {object}
                </MenuItem>
            ))}
        </SelectMenu>
    );
}
