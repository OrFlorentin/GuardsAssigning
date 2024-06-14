import { Button, Dialog, DialogTitle, MenuItem } from '@mui/material';
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { Formik } from 'formik';
import moment from 'moment';
import React from 'react';
import * as Yup from 'yup';
import { useAppContext } from './AppContext';
import { createShift } from './Calls';
import CloseButton from './CloseButton';
import { CenterContainer, FlexForm, RowContainerSpaceBetween } from './Containers';
import BooleanSelectField from './FormFields/BooleanSelectField';
import SelectField from './FormFields/SelectField';
import TextField from './FormFields/TextField';
import { useCustomSnackbar } from './SnackbarUtils';
import { getShiftTypeByID } from './Utils';

const formSchema = Yup.object().shape({
    branch: Yup.string().required('Required'),
});

export default function NewSlotDialog({ isDialogOpen, setIsDialogOpen, activeShift }) {
    const { setShifts, branches, guards, shiftTypes } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar, showWarningSnackbar } = useCustomSnackbar();

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const showSuccess = () => {
        const isExistingShift = !!activeShift?._id;

        isExistingShift ?
            showSuccessSnackbar('edit-shift-success', 'המשחק נערך בהצלחה') :
            showSuccessSnackbar('create-shift-success', 'המשחק נוצר בהצלחה');
    }

    const showError = () => {
        const isExistingShift = !!activeShift?._id;

        isExistingShift ?
            showErrorSnackbar('edit-shift-failed', 'עריכת משחק נכשלה') :
            showErrorSnackbar('create-shift-failed', 'יצירת משחק נכשלה');
    }

    const buildShift = (values) => {
        const defaultScore = {
            regular_score: 0,
            weekend_score: 0
        };

        const shiftType = getShiftTypeByID(values.shiftType, shiftTypes);
        return {
            branch: values.branch,
            is_holiday: values.isHoliday,
            num_days: values.numDays,
            shift_type: values.shiftType,
            date: values.date.format('YYYY-MM-DD'),
            is_custom_score: false,
            score: defaultScore,
            population_type: shiftType.population_type,
            order: values.order - 1
        };
    }

    const handleSubmit = (values) => {
        setIsDialogOpen(false);
        const shiftToSend = buildShift(values);

        createShift(shiftToSend)
            .then((response) => {
                const newShift = response.data;

                setShifts((prevShifts) => {
                    const newShifts = [...prevShifts];

                    const shiftIndex = prevShifts.indexOf(activeShift);

                    if (shiftIndex === -1) {
                        newShifts.push(newShift);
                    } else {
                        newShifts[shiftIndex] = newShift;
                    }

                    return newShifts;
                });

                showSuccess();
            })
            .catch(() => {
                showError();
            })
    };


    return (
        <>
            <Dialog dir="rtl" onClose={handleClose} open={isDialogOpen} fullWidth>
                <DialogTitle>
                    יצירת משחק חדש
                    <CloseButton onClick={handleClose} />
                </DialogTitle>
                <CenterContainer>
                    <Formik
                        initialValues={{
                            branch: branches[0]?._id,
                            isHoliday: false,
                            shiftType: shiftTypes[0]?._id,
                            date: moment().startOf('day'),
                            numDays: 1,
                            order: 1
                        }}
                        validationSchema={formSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ submitForm, setFieldValue, setValues, values, errors, touched }) => (
                            <FlexForm>
                                <div>
                                    <SelectField
                                        fullWidth
                                        label="קבוצה"
                                        value={values.branch}
                                        onChange={(e) => {
                                            setFieldValue('branch', e.target.value);
                                        }}
                                    >
                                        {branches.map((branch) => (
                                            <MenuItem key={branch.name} value={branch._id}>
                                                {branch.name}
                                            </MenuItem>
                                        ))}
                                    </SelectField>
                                    {errors.branch && touched.branch && <div>{errors.branch}</div>}
                                </div>

                                <SelectField
                                    fullWidth
                                    label="סוג משחק"
                                    value={values.shiftType}
                                    onChange={(e) => {
                                        setFieldValue('shiftType', e.target.value);
                                    }}
                                >
                                    {shiftTypes.map((shiftType) => (
                                        <MenuItem key={shiftType.name} value={shiftType._id}>
                                            {shiftType.name}
                                        </MenuItem>
                                    ))}
                                </SelectField>

                                <LocalizationProvider dateAdapter={AdapterMoment} locale="heLocale">
                                    <DatePicker
                                        label="תאריך"
                                        inputFormat='DD/MM/YYYY'
                                        openTo="day"
                                        views={['day']}
                                        value={values.date}
                                        onChange={(date) => { setFieldValue('date', date) }}
                                        renderInput={(params) => <TextField {...params} />}
                                    />
                                </LocalizationProvider>

                                <TextField
                                    label="מספר ימים"
                                    type="number"
                                    value={values.numDays}
                                    onChange={(e) => {
                                        setFieldValue('numDays', e.target.value);
                                    }}
                                />

                                <TextField
                                    label="סבב"
                                    type="number"
                                    value={values.order}
                                    onChange={(e) => {
                                        setFieldValue('order', e.target.value);
                                    }}
                                />

                                <BooleanSelectField
                                    label="חג"
                                    value={values.isHoliday}
                                    onChange={(e) => setFieldValue('isHoliday', e.target.value)}
                                />


                                <RowContainerSpaceBetween marginTop={'1em'} marginBottom={'2em'}>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={submitForm}
                                        fullWidth
                                    >
                                        צור משחק
                                    </Button>
                                </RowContainerSpaceBetween>
                            </FlexForm>
                        )}
                    </Formik>
                </CenterContainer>
            </Dialog>
        </>
    );
}
