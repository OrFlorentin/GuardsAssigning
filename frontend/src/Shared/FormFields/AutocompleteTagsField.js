import { Autocomplete, TextField } from '@mui/material';
import { Field } from 'formik';
import React from 'react';

export default function AutocompleteTagsField({
    label,
    options,
    getOptionLabel,
    ...props
}) {
    return (
        <Field
            multiple
            filterSelectedOptions
            component={Autocomplete}
            options={options}
            getOptionLabel={getOptionLabel}
            renderInput={(params) => <TextField {...params} label={label} variant="outlined" />}
            {...props}
        />
    );
}
