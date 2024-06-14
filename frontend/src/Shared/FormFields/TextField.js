import MuiTextField from '@mui/material/TextField';
import { Field } from 'formik';
import React from 'react';

export default function TextField(props) {
    return (
        <Field
            component={MuiTextField}
            variant="outlined"
            margin="normal"
            {...props}
        />
    );
}
