import React from 'react';
import styled from 'styled-components';
import { Box, FormControl, InputLabel, Select } from '@mui/material';

export default function SelectMenu({ title, value, onSelectChange, sx, children }) {
    return (
        <Box p={1}>
            <Form>
                <InputLabel id="select-label">{title}</InputLabel>

                <Select
                    label={title}
                    labelId="select-label"
                    id="select"
                    value={value}
                    onChange={onSelectChange}
                >
                    {children}
                </Select>
            </Form>
        </Box>
    );
}

const Form = styled(FormControl)`
    min-width: 120px;
    margin-top: 10px;
    left: 2%;
`;
