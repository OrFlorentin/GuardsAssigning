import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import { Formik } from 'formik';
import { useAppContext } from '../Shared/AppContext';
import { fetchAndUpdateGuards, updatePopulationSettings } from '../Shared/Calls';
import CloseButton from '../Shared/CloseButton';
import { CenterContainer, FlexForm } from '../Shared/Containers';
import BooleanSelectField from '../Shared/FormFields/BooleanSelectField';
import TextField from '../Shared/FormFields/TextField';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import { getDateDay, getOnlyPopulationSettingsAndAlert } from '../Shared/Utils';
import { PopulationType } from '../Shared/Enums';
import { DateField } from '../Shared/FormFields/DateField';

export default function EditPopulationSettings({ isDialogOpen, setIsDialogOpen, activeGuard }) {
    const { setGuards } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();
    const guardPopulationSettings = getOnlyPopulationSettingsAndAlert(activeGuard, showErrorSnackbar);
    const currentPopulationType = guardPopulationSettings?.population_type;

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const sendEditPopulationSettings = (values) => {
        // TODO: fix numeric (type="number") params that are being converted into strings
        // TODO: treat conflicts in data fields when switching populations

        let extra_params = {
            num_holidays: values.numHolidays
        };

        switch (currentPopulationType) {
            case PopulationType.OFFICER:
                extra_params['has_done_bhd1'] = values.hasDoneBhd1;
                break;
        }

        const updatePopulationSettingsRequest = {
            initial_score: {
                regular_score: values.initialRegularScore,
                weekend_score: values.initialWeekendScore
            },
            score_multiplier: values.scoreMultiplier,
            join_date: values.joinDate,
            extra_params
        }

        updatePopulationSettings({ guardId: activeGuard._id, populationType: currentPopulationType, updatePopulationSettingsRequest })
            .then(() => {
                fetchAndUpdateGuards(setGuards).then(() => {
                    showSuccessSnackbar('edit-score-success', 'עריכת הגדרות מעמד הושלמה')
                })
            })
            .catch(() => {
                showErrorSnackbar('edit-score-failed', 'עריכת הגדרות מעמד נכשלה')
            });
    };

    const handleSubmit = (values) => {
        sendEditPopulationSettings(values);
        handleClose();
    };

    const getInitialValues = () => {
        const extraParams = guardPopulationSettings?.extra_params

        let initialValues = {
            initialRegularScore: guardPopulationSettings?.initial_score?.regular_score,
            initialWeekendScore: guardPopulationSettings?.initial_score?.weekend_score,
            scoreMultiplier: guardPopulationSettings?.score_multiplier,
            joinDate: guardPopulationSettings?.join_date,
            numHolidays: extraParams?.num_holidays
        }

        switch (currentPopulationType) {
            case PopulationType.OFFICER:
                initialValues['hasDoneBhd1'] = extraParams?.has_done_bhd1;
                break;
        }

        return initialValues;
    };


    const dialogTitle = `עריכת הגדרות מעמד - ${activeGuard?.name}`;

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                <CenterContainer>
                    <Formik initialValues={getInitialValues()} onSubmit={handleSubmit}>
                        {({ submitForm, setFieldValue, values }) => (
                            <>
                                <FlexForm>
                                    <DateField
                                        label="תאריך הצטרפות"
                                        defaultValue={getDateDay(values.joinDate)}
                                        onChange={(e) => setFieldValue('joinDate', e.target.value)}
                                    />

                                    <TextField
                                        label="ניקוד רגיל (התחלתי)"
                                        type="number"
                                        onChange={(e) => setFieldValue('initialRegularScore', e.target.value)}
                                        value={values.initialRegularScore}
                                    />

                                    <TextField
                                        label="ניקוד סופש (התחלתי)"
                                        type="number"
                                        value={values.initialWeekendScore}
                                        onChange={(e) => setFieldValue('initialWeekendScore', e.target.value)}
                                    />

                                    <TextField
                                        label="מכפיל ניקוד"
                                        type="number"
                                        value={values.scoreMultiplier}
                                        onChange={(e) => setFieldValue('scoreMultiplier', e.target.value)}
                                    />

                                    <TextField
                                        label="מספר חגים"
                                        type="number"
                                        value={values.numHolidays}
                                        onChange={(e) => setFieldValue('numHolidays', e.target.value)}
                                    />

                                    {currentPopulationType === PopulationType.OFFICER && (
                                        <BooleanSelectField
                                            label="האם עשה בהד 1"
                                            value={values.hasDoneBhd1}
                                            onChange={(e) => setFieldValue('hasDoneBhd1', e.target.value)}
                                        />
                                    )}

                                    <Button
                                        color="primary"
                                        variant="contained"
                                        onClick={submitForm}
                                    >
                                        שמור
                                    </Button>
                                </FlexForm>
                            </>
                        )}
                    </Formik>
                </CenterContainer>
            </DialogContent>
        </Dialog>
    );
}
