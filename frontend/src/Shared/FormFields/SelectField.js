import { TextField } from '@mui/material';
import { Field } from 'formik';
import React from 'react';

export default function SelectField(props) {
    return (
        <Field
            component={TextField}
            select
            variant="outlined"
            margin="normal"
            {...props}
        />
    );
}
