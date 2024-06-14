import React from 'react';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import GenericAutocompleteField from './GenericAutocompleteField';
import { TextField, MenuItem, Typography } from '@mui/material';
import { useCustomSnackbar } from '../SnackbarUtils';
import { getOnlyPopulationSettingsAndAlert } from '../Utils';
import { useMemo } from 'react';

export default function GuardsAutocomplete({
    label,
    options,
    getOptionLabel,
    value,
    onChange,
    isOptionRestricted,
}) {
    const isError = isOptionRestricted(value);
    const { showErrorSnackbar } = useCustomSnackbar();

    const getGuardScore = (guard) => {
        const guardPopulationSettings = getOnlyPopulationSettingsAndAlert(guard, showErrorSnackbar);
        const regularScore = guardPopulationSettings?.score?.regular_score;
        return regularScore;
    };

    // Sort guards by score
    const sortedGuards = useMemo(
        () => options.sort((left, right) => getGuardScore(left) - getGuardScore(right)),
        [options]
    );

    return (
        <GenericAutocompleteField
            options={sortedGuards}
            getOptionLabel={getOptionLabel}
            value={value}
            onChange={onChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    variant="outlined"
                    helperText={isError ? 'השחקן הסתייג מתאריך זה.' : ''}
                    error={isError}
                />
            )}
            renderOption={(props, option) => (
                <MenuItem {...props}>
                    {option.name}
                    <Typography component="div" sx={{ flexGrow: 1 }} />
                    {isOptionRestricted(option) && <>
                        <WarningAmberRoundedIcon style={{ fill: '#d32f2f' }} />
                    </>}
                    <Typography color="gray">{getGuardScore(option)}</Typography>
                </MenuItem>
            )}
        />
    );
}
