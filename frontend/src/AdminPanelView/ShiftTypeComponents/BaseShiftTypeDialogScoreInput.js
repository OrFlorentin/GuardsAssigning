import { Box } from "@mui/material";
import TextField from "../../Shared/FormFields/TextField";


export default function BaseShiftTypeDialogScoreInput({
    setFieldValue,
    values
}) {
    const ScoreInput = ({ label, fieldValue }) => {
        return (
            <TextField
                label={label}
                type="number"
                onChange={(e) => setFieldValue(fieldValue, e.target.value)}
                value={values[fieldValue]}
                variant="standard"
                size='small'
                sx={{
                    flexBasis: 0,
                    flexGrow: 1
                }}
            />
        );
    }
    
    return (
        <>
            <Box>
                ניקוד ברירת מחדל
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flex: 1,
                    gap: '2em'
                }}
            >
                <ScoreInput 
                    label="רגיל"
                    fieldValue={'defaultScoreRegular'}
                />
                <ScoreInput 
                    label="חמישי"
                    fieldValue={'defaultScoreThursday'}
                />
                <ScoreInput 
                    label='סופ"ש'
                    fieldValue={'defaultScoreWeekend'}
                />
            </Box>
        </>
    );
}
