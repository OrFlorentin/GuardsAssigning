import { Checkbox, FormControlLabel } from '@mui/material';
import { Field } from 'formik';
import React from 'react';

export default function CheckboxField({
    label,
    defaultValue,
    onChange,
    ...props
}) {
    return (
        <FormControlLabel label={label} control={<Field
            type="checkbox"
            component={Checkbox}
            onChange={onChange}
            renderInput={(params) => <Checkbox {...params} />}
            defaultChecked={defaultValue}
            {...props}
        />} />
    );
}
