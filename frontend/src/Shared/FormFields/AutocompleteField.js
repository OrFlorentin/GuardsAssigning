import { Autocomplete, TextField } from '@mui/material';
import { Field } from 'formik';
import React from 'react';

export default function AutocompleteField({
    label,
    options,
    getOptionLabel,
    ...props
}) {
    return (
        <Field
            component={Autocomplete}
            options={options}
            getOptionLabel={getOptionLabel}
            renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
            {...props}
        />
    );
}
