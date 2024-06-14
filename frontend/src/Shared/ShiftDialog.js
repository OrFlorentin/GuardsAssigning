import { Button, Dialog, DialogTitle, MenuItem } from '@mui/material';
import { Formik } from 'formik';
import React from 'react';
import CloseButton from './CloseButton';
import BooleanSelectField from './FormFields/BooleanSelectField';
import SelectField from './FormFields/SelectField';
import TextField from './FormFields/TextField';
import { getOnlyPopulationSettingsAndAlert, filterGuards, getShiftGuard, getShiftType, isSameDate } from '../Shared/Utils';
import { CenterContainer, FlexForm, RowContainerSpaceBetween } from './Containers';
import { createShift, deleteShift, putShift } from './Calls';
import * as Yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import GuardsAutocomplete from './FormFields/GuardsAutocomplete';
import { useAppContext } from './AppContext';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import axios from 'axios';
import CheckboxField from './FormFields/CheckboxField';

const formSchema = Yup.object().shape({
    branch: Yup.string().required('Required'),
});

export default function ShiftDialog({ isDialogOpen, setIsDialogOpen, activeShift }) {
    const { setShifts, branches, guards, shiftTypes } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar, showWarningSnackbar } = useCustomSnackbar();

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const isGuardRestricted = (guard) => {
        const populationSettings = getOnlyPopulationSettingsAndAlert(guard, showWarningSnackbar);

        const restrictionInShiftDate = populationSettings?.restrictions.find((restriction) =>
            isSameDate(restriction.date, activeShift?.date));

        return !!restrictionInShiftDate;
    }

    const handleDelete = (shift_id) => {
        setIsDialogOpen(false);

        deleteShift(shift_id).then(() =>
            setShifts((prevShifts) => {
                const deletedShiftIndex = prevShifts.findIndex((shift) => shift._id === shift_id);
                const newShifts = [...prevShifts];
                newShifts.splice(deletedShiftIndex, 1);

                return newShifts;
            })
        );
    };

    const sendShift = (shift) => {
        const isExistingShift = !!shift?._id;

        return isExistingShift ? putShift(shift) : createShift(shift);
    }

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
        return {
            ...activeShift,
            assigned_user_id: values?.guard?._id || null,
            branch: values.branch,
            is_holiday: values.isHoliday,
            num_days: values.numDays,
            score: {
                regular_score: values.regularScore,
                weekend_score: values.weekendScore
            },
            is_custom_score: values.isCustomScore
        };
    }

    const handleSubmit = (values) => {
        setIsDialogOpen(false);
        const shiftToSend = buildShift(values);

        sendShift(shiftToSend)
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

    const updateDefaultScore = ({ values, setValues }) => {
        // Update score to default score by selected guard and shift type
        if (values.isCustomScore) {
            return;
        }

        if (values.branch) {
            const updatedShift = buildShift(values);
            updatedShift.score = {}

            axios.post('/shifts/default_score', updatedShift, {
                headers: {
                    'content-type': 'application/json',
                }
            }).then(response => {
                const { weekend_score, regular_score } = response.data;
                setValues({ ...values, weekendScore: weekend_score, regularScore: regular_score });
            }).catch(error => {
                console.log(error);
            });
        }
    };

    return (
        <>
            <Dialog dir="rtl" onClose={handleClose} open={isDialogOpen} fullWidth>
                <DialogTitle>
                    עריכת סבב {activeShift.order} ({getShiftType(activeShift, shiftTypes)?.name})
                    <CloseButton onClick={handleClose} />
                </DialogTitle>
                <CenterContainer>
                    <Formik
                        initialValues={{
                            guard: getShiftGuard(activeShift, guards),
                            branch: activeShift.branch,
                            isHoliday: activeShift.is_holiday,
                            numDays: activeShift.num_days,
                            regularScore: activeShift?.score?.regular_score,
                            weekendScore: activeShift?.score?.weekend_score,
                            isCustomScore: activeShift?.is_custom_score || false,
                        }}
                        validationSchema={formSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ submitForm, setFieldValue, setValues, values, errors, touched }) => (
                            <FlexForm>
                                <GuardsAutocomplete
                                    label="שחקן"
                                    options={filterGuards(guards, values.branch, activeShift.population_type)}
                                    getOptionLabel={(option) => option.name}
                                    value={values.guard}
                                    onChange={(_, value) => {
                                        setFieldValue('guard', value);
                                        values.guard = value;
                                        updateDefaultScore({ values, setValues });
                                    }}
                                    isOptionRestricted={isGuardRestricted}
                                />
                                <div>
                                    <SelectField
                                        style={{ width: '100%' }}
                                        label="קבוצה"
                                        value={values.branch}
                                        onChange={(e) => {
                                            setFieldValue('branch', e.target.value);

                                            values.branch = e.target.value;
                                            updateDefaultScore({ values, setValues });
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

                                <TextField
                                    label="מספר ימים"
                                    type="number"
                                    value={values.numDays}
                                    onChange={(e) => {
                                        setFieldValue('numDays', e.target.value);
                                        values.numDays = e.target.value;
                                        updateDefaultScore({ values, setValues });
                                    }}
                                />

                                <BooleanSelectField
                                    label="חג"
                                    value={values.isHoliday}
                                    onChange={(e) => setFieldValue('isHoliday', e.target.value)}
                                />

                                <TextField
                                    label="ניקוד רגיל"
                                    type="number"
                                    onChange={(e) => setFieldValue('regularScore', e.target.value)}
                                    value={values.regularScore}
                                    disabled={!values.isCustomScore}
                                />
                                <TextField
                                    label="ניקוד סופש"
                                    type="number"
                                    value={values.weekendScore}
                                    onChange={(e) => setFieldValue('weekendScore', e.target.value)}
                                    disabled={!values.isCustomScore}
                                />
                                <CheckboxField
                                    label="ניקוד מותאם אישית"
                                    value={values.isCustomScore}
                                    checked={values.isCustomScore}
                                    onChange={(_, value) => {
                                        setFieldValue('isCustomScore', value);

                                        values.isCustomScore = value;
                                        updateDefaultScore({ values, setValues });
                                    }}
                                />

                                <RowContainerSpaceBetween marginTop={'1em'} marginBottom={'2em'}>
                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={submitForm}
                                        style={{ width: '20em' }}
                                    >
                                        שמור
                                    </Button>
                                    <Button
                                        color="error"
                                        variant="contained"
                                        onClick={() => handleDelete(activeShift._id)}
                                        endIcon={<DeleteIcon style={{ marginRight: '0.5em' }} />}
                                    >
                                        מחק סבב
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
