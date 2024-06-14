import {
    Button,
    Checkbox, Dialog,
    DialogTitle,
    MenuItem,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Typography
} from '@mui/material';
import axios from 'axios';
import { Formik } from 'formik';
import moment from 'moment';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../Shared/AppContext';
import { ColumnContainer, RowContainer } from '../Shared/Containers';
import { PopulationType } from '../Shared/Enums';
import AutocompleteTagsField from '../Shared/FormFields/AutocompleteTagsField';
import CheckboxField from '../Shared/FormFields/CheckboxField';
import SelectField from '../Shared/FormFields/SelectField';
import TextField from '../Shared/FormFields/TextField';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import { getShiftTypeByID } from '../Shared/Utils';
import DatesPickingStep from './AutoAssignDialogComponents/DatesPickingStep';
import LoadingDialog from './LoadingDialog';

function retrieveDefaultConstraints(populationType, appContextDefaultConstraints) {
    // TODO pull both Regular and Weekend constraints.
    switch (populationType) {
        case PopulationType.HOGER:
            return JSON.stringify(appContextDefaultConstraints.HogerRegular, null, 2);
        case PopulationType.OFFICER:
            return JSON.stringify(appContextDefaultConstraints.OfficerRegular, null, 2);
    }

}

export default function AutoAssignDialog({ isDialogOpen, setIsDialogOpen, guards, shifts }) {
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();
    const { setShifts, filteredBranch, branches, populationTypes, defaultConstraints, shiftTypes, managedBranches, currentUser } = useAppContext();


    const defaultBranch = filteredBranch ? filteredBranch : null;
    const defaultPopulationType = populationTypes[0];
    const defaultGuards = guards.filter(guard => guard.branch === defaultBranch && guard.population_types.includes(defaultPopulationType));
    const defaultShifts = shifts.filter(shift => shift.branch === defaultBranch && shift.population_type === defaultPopulationType);
    const [isCalculating, setIsCalculating] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [startDate, setStartDate] = useState(moment());
    const [endDate, setEndDate] = useState(moment().add(2, 'month'));


    const initialValues = {
        branch: defaultBranch,
        populationType: defaultPopulationType,
        guards: defaultGuards,
        shifts: defaultShifts,
        guardsPool: [...defaultGuards],
        shiftsPool: [...defaultShifts],
        overwriteManualAssignments: true,
        constraints: retrieveDefaultConstraints(defaultPopulationType, defaultConstraints)
    }

    const handleClose = () => {
        setIsDialogOpen(false);
        setActiveStep(0);
    };

    const handleSubmit = (values) => {
        setIsCalculating(true);
        const db_users_ids = values.guards.map(guard => guard._id);
        const db_shifts_ids = values.shifts.map(shift => shift._id);

        let constraints;

        try {
            constraints = JSON.parse(values.constraints);
        } catch (e) {
            const errorMsg = "Failed to parse constraints json";
            showErrorSnackbar('auto-assignment-failed', `Auto assignment failed: ${errorMsg}`);
            return;
        }

        const request = {
            db_users_ids,
            db_shifts_ids,
            constraints
        }
        axios.post('/assignments_model/', request, {
            headers: {
                'content-type': 'application/json',
            },
            params: {
                branch_id: values.branch,
                population_type: values.populationType,
                overwrite_manual_assignments: values.overwriteManualAssignments
            }
        }).then(response => {
            setIsCalculating(false);
            axios.get('/shifts/').then((response) => {
                setShifts(response.data);
                setIsDialogOpen(false);
                setActiveStep(0);
            });
            showSuccessSnackbar('auto-assignment-success', `Auto assignment of ${response?.data?.length} shifts completed successfully!`);
        }).catch((error) => {
            setIsCalculating(false);
            const errorMsg = error?.response?.data?.detail || 'Unknown error'
            showErrorSnackbar('auto-assignment-failed', `Auto assignment failed: ${errorMsg}`);
        });
    }

    const resetShifts = (values, setFieldValue) => {
        const newShifts = shifts.filter(shift => shift.branch === values.branch
            && shift.population_type === values.populationType
            && moment(shift.date).isSameOrAfter(startDate, 'date')
            && moment(shift.date).isSameOrBefore(endDate, 'date'));
        setFieldValue('shifts', newShifts);
    }

    const resetFormValues = ({ values, setValues, update }) => {
        const updatedValues = {
            ...values, ...update
        };

        const newGuards = guards.filter(guard => guard.branch === updatedValues.branch && guard.population_types.includes(updatedValues.populationType));
        const newShifts = shifts.filter(shift => shift.branch === updatedValues.branch && shift.population_type === updatedValues.populationType);

        const newValues = ({
            ...updatedValues,
            guards: newGuards,
            shifts: newShifts,
            guardsPool: [...newGuards],
            shiftsPool: [...newShifts],
            constraints: retrieveDefaultConstraints(updatedValues.populationType, defaultConstraints)
        });
        setValues(newValues);
    }

    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };

    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    return (
        <div>
            <Dialog scroll="paper" onClose={handleClose} open={isDialogOpen} fullWidth>
                <DialogTitle>שיבוץ אוטומטי</DialogTitle>
                <Formik
                    enableReinitialize
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                >
                    {({ initialValues, handleSubmit, setFieldValue, values, setValues, resetForm, errors, touched }) => (
                        <CenterContainer>
                            <Stepper sx={{ width: '100%' }} activeStep={activeStep} orientation="vertical">
                                <Step key={0}>
                                    <StepLabel>בחירת קבוצה ומעמד</StepLabel>
                                    <StepContent>
                                        <ColumnContainer>
                                            <RowContainer style={{ justifyContent: 'space-evenly' }}>
                                                <SelectField
                                                    sx={{ flex: 1 }}
                                                    label="מעמד"
                                                    defaultValue={initialValues.populationType}
                                                    onChange={(e) => {
                                                        setFieldValue('populationType', e.target.value)
                                                        resetFormValues({ values, setValues, update: { populationType: e.target.value } });
                                                    }}
                                                >
                                                    {populationTypes.map((populationType, index) => (
                                                        <MenuItem key={index} value={populationType}>
                                                            {populationType}
                                                        </MenuItem>
                                                    ))}
                                                </SelectField>
                                                <SelectField
                                                    sx={{ ml: 1 }}
                                                    label="קבוצה"
                                                    defaultValue={initialValues.branch}
                                                    onChange={(e) => {
                                                        setFieldValue('branch', e.target.value);
                                                        resetFormValues({ values, setValues, update: { branch: e.target.value } });
                                                    }}
                                                >
                                                    {managedBranches.map((branch, index) => (
                                                        <MenuItem key={index} value={branch._id}>
                                                            {branch.name}
                                                        </MenuItem>
                                                    ))}
                                                </SelectField>
                                            </RowContainer>
                                            <CheckboxField
                                                component={Checkbox}
                                                onChange={(_, value) => setFieldValue('overwriteManualAssignments', value)}
                                                label='שבץ מחדש משחקים אשר שובצו בעבר'
                                                defaultChecked
                                            />
                                            <Button
                                                variant="contained"
                                                onClick={handleNext}
                                                sx={{ mt: 1 }}
                                            >
                                                המשך
                                            </Button>
                                        </ColumnContainer>
                                    </StepContent>
                                </Step>

                                <Step key={1}>
                                    <StepLabel>בחירת תאריך התחלה וסיום</StepLabel>
                                    <StepContent>
                                        <DatesPickingStep
                                            onChangeEndDate={(date) => {
                                                setEndDate(date);
                                            }}
                                            onChangeStartDate={(date) => {
                                                setStartDate(date);
                                            }}
                                            startDate={startDate}
                                            endDate={endDate}
                                        />
                                        <RowContainer>
                                            <Button
                                                variant="contained"
                                                onClick={() => {
                                                    resetShifts(values, setFieldValue);
                                                    handleNext();
                                                }}
                                                sx={{ mt: 1, mr: 1, flex: 1 }}
                                            >
                                                המשך
                                            </Button>
                                            <Button
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1, minWidth: '30%' }}
                                            >
                                                חזור
                                            </Button>
                                        </RowContainer>
                                    </StepContent>
                                </Step>

                                <Step key={2}>
                                    <StepLabel>עריכת שחקנים ומשחקים</StepLabel>
                                    <StepContent>
                                        <ColumnForm onSubmit={handleSubmit}>
                                            <AutocompleteTagsField
                                                label="שחקנים"
                                                options={values.guardsPool}
                                                getOptionLabel={(option) => option.name}
                                                onChange={(_, value) => setFieldValue('guards', value)}
                                                defaultValue={initialValues.guards}
                                                style={{ marginTop: '1em' }}
                                                value={values.guards}
                                                limitTags={25}
                                            />
                                            <AutocompleteTagsField
                                                label="משחקים"
                                                options={values.shiftsPool}
                                                getOptionLabel={(option) => getShiftTypeByID(option.shift_type, shiftTypes)?.name + ", " + moment(option.date).format('dddd, DD/MM') + ", סבב " + option.order}
                                                onChange={(_, value) => setFieldValue('shifts', value)}
                                                defaultValue={shifts}
                                                style={{ marginTop: '1em' }}
                                                value={values.shifts}
                                                limitTags={25}
                                            />
                                        </ColumnForm>
                                        <RowContainer>
                                            <Button
                                                variant="contained"
                                                onClick={handleNext}
                                                sx={{ mt: 1, mr: 1, flex: 1 }}
                                            >
                                                המשך
                                            </Button>
                                            <Button
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1, minWidth: '30%' }}
                                            >
                                                חזור
                                            </Button>
                                        </RowContainer>
                                    </StepContent>
                                </Step>

                                <Step key={3}>
                                    <StepLabel>הגבלות</StepLabel>
                                    <StepContent>
                                        <TextField
                                            //TODO add another field for weekend constraints
                                            margin="dense"
                                            id="constraints"
                                            label="עריכת הגבלות"
                                            type="text"
                                            fullWidth
                                            multiline
                                            maxRows={20}
                                            variant="standard"
                                            defaultValue={initialValues.constraints}
                                            value={values.constraints}
                                            onChange={(e) => setFieldValue('constraints', e.target.value)}
                                        />

                                        <RowContainer>
                                            <Button
                                                sx={{ mt: 1, mr: 1, flex: 1 }}
                                                color="primary"
                                                variant="contained"
                                                type="submit"
                                                onClick={handleSubmit}
                                            >
                                                התחל שיבוץ אוטומטי
                                            </Button>
                                            <Button
                                                onClick={handleBack}
                                                sx={{ mt: 1, mr: 1, minWidth: '30%' }}
                                            >
                                                חזור
                                            </Button>
                                        </RowContainer>
                                    </StepContent>
                                </Step>
                            </Stepper>
                        </CenterContainer>
                    )}
                </Formik>
            </Dialog>
            <LoadingDialog
                isLoading={isCalculating}
                title={"תהליך השיבוץ האוטומטי החל"}
            >
                <Typography>
                    השיבוץ האוטומטי החל עבור שחקנים ומשחקים שנבחרו.
                </Typography>
                <Typography>
                    התהליך לא אמור לארוך יותר מחצי דקה. אנא המתן בזמן זה.
                </Typography>
            </LoadingDialog>
        </div>
    );
}

const CenterContainer = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 1em;
    padding: 1em;
`;

const ColumnForm = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
`;
