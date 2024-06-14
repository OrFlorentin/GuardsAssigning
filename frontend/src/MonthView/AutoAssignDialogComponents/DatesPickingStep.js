import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { RowContainer } from "../../Shared/Containers";
import TextField from "../../Shared/FormFields/TextField";

export default function DatesPickingStep({
    startDate,
    onChangeStartDate,
    endDate,
    onChangeEndDate
}) {
    return (
        <RowContainer style={{ justifyContent: 'space-between' }}>
            <LocalizationProvider dateAdapter={AdapterMoment} locale="heLocale">
                <DatePicker
                    disablePast
                    label="תאריך סיום"
                    inputFormat='DD/MM/YYYY'
                    openTo="day"
                    views={['day']}
                    value={endDate}
                    onChange={onChangeEndDate}
                    renderInput={(params) => <TextField {...params} />}
                />

                <DatePicker
                    disablePast
                    label="תאריך התחלה"
                    inputFormat='DD/MM/YYYY'
                    openTo="day"
                    views={['day']}
                    value={startDate}
                    onChange={onChangeStartDate}
                    renderInput={(params) => <TextField {...params} />}
                />
            </LocalizationProvider>
        </RowContainer>
    );
}
