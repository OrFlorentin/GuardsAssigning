import { MenuItem } from '@mui/material';
import SelectField from './SelectField';

const BOOLEAN_OPTION_LABELS = { false: 'לא', true: 'כן' };

export default function BooleanSelectField(props) {
    return (
        <SelectField {...props} >
            {Object.keys(BOOLEAN_OPTION_LABELS).map((option) => (
                <MenuItem key={option} value={option}>
                    {BOOLEAN_OPTION_LABELS[option]}
                </MenuItem>
            ))}
        </SelectField>
    );
}
