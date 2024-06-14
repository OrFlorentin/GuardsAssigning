import { Autocomplete } from '@mui/material';
import { Field } from 'formik';
import React from 'react';

export default function GenericAutocompleteField({
    options,
    getOptionLabel,
    renderInput,
    renderOption,
    ...props
}) {
    return (
        <Field
            component={Autocomplete}
            options={options}
            getOptionLabel={getOptionLabel}
            renderInput={renderInput}
            renderOption={renderOption}
            {...props}
        />
    );
}
