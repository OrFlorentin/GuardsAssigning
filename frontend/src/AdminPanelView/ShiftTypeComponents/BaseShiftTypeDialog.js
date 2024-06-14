import { Button, Dialog, DialogContent, DialogTitle, MenuItem } from "@mui/material";
import { Formik } from "formik";
import { useAppContext } from "../../Shared/AppContext";
import { editShiftType, fetchAndUpdateShiftTypes, putShiftType } from "../../Shared/Calls";
import CloseButton from "../../Shared/CloseButton";
import { CenterContainer, FlexForm } from "../../Shared/Containers";
import SelectField from "../../Shared/FormFields/SelectField";
import TextField from "../../Shared/FormFields/TextField";
import { useCustomSnackbar } from "../../Shared/SnackbarUtils";
import BaseShiftTypeDialogScoreInput from "./BaseShiftTypeDialogScoreInput";


export default function BaseShiftTypeDialog({
    isEdit,
    isDialogOpen,
    setIsDialogOpen,
    activeShiftType
}) {
    const { populationTypes, setShiftTypes } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const handleOnClose = () => {
        setIsDialogOpen(false);
    };

    const handleError = (key) => {
        return ((e) => {
            let msg;
            try {
                msg = `${e.response.data.detail[0].loc.join('.')} - ${e.response.data.detail[0].msg}`;
            }
            catch {
                msg = e.message;
            }
            finally {
                showErrorSnackbar(key, msg);
            }
        });
    };

    const sendEditShiftType = (values) => {
        const editShiftTypeParams = {
            _id: activeShiftType._id,
            name: values.name,
            description: values.description || '',
            slots_count: values.dailySlots,
            population_type: values.populationType,
            score_config: {
                REGULAR_DAY: values.defaultScoreRegular,
                THURSDAY: values.defaultScoreThursday,
                WEEKEND: values.defaultScoreWeekend 
            }
        };
        
        editShiftType(activeShiftType._id, editShiftTypeParams).then(() => {
            fetchAndUpdateShiftTypes(setShiftTypes).then(() => {
                showSuccessSnackbar('edit-shift-type-success', 'עריכת סוג משחק הושלמה');
            });
        }).catch(handleError('edit-shift-type-failed'));
    };

    const sendPutShiftType = (values) => {
        const putShiftTypeParams = {
            name: values.name,
            description: values.description || '',
            slots_count: values.dailySlots,
            population_type: values.populationType,
            score_config: {
                REGULAR_DAY: values.defaultScoreRegular,
                THURSDAY: values.defaultScoreThursday,
                WEEKEND: values.defaultScoreWeekend
            }
        };
        
        putShiftType(putShiftTypeParams).then(() => {
            fetchAndUpdateShiftTypes(setShiftTypes).then(() => {
                showSuccessSnackbar('create-shift-type-success', 'יצירת סוג משחק הושלמה');
            });
        }).catch(handleError('create-shift-type-failed'));
    };

    const handleSubmit = (values) => {
        if (isEdit) {
            sendEditShiftType(values);
        } else {
            sendPutShiftType(values);
        }
        handleOnClose();
    };

    let dialogTitle;
    if (isEdit) {
        dialogTitle = `עריכת סוג משחק - ${activeShiftType?.name}`;
    } else {
        dialogTitle = 'יצירת סוג משחק';
    }

    let formInitialValues;
    if (isEdit) {
        formInitialValues = {
            name: activeShiftType?.name,
            description: activeShiftType?.description || '',
            dailySlots: activeShiftType?.slots_count,
            populationType: activeShiftType?.population_type,
            defaultScoreRegular: activeShiftType?.score_config.REGULAR_DAY || 0,
            defaultScoreThursday: activeShiftType?.score_config.THURSDAY || 0,
            defaultScoreWeekend: activeShiftType?.score_config.WEEKEND || 0
        };
    } else {
        formInitialValues = {
            name: '',
            description: '',
            dailySlots: 0,
            populationType: populationTypes[0],
            defaultScoreRegular: 0,
            defaultScoreThursday: 0,
            defaultScoreWeekend: 0
        };
    }

    return (
        <Dialog open={isDialogOpen} onClose={handleOnClose} dir="rtl" maxWidth="sm" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleOnClose} />
            </DialogTitle>
            <DialogContent>
                <CenterContainer>
                    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
                        {({ submitForm, setFieldValue, values }) => (
                            <>
                                <FlexForm>
                                    <TextField
                                        label="שם"
                                        type="text"
                                        onChange={(e) => setFieldValue('name', e.target.value)}
                                        value={values.name}
                                    />
                                    <TextField
                                        label="תיאור"
                                        type="text"
                                        onChange={(e) => setFieldValue('description', e.target.value)}
                                        value={values.description}
                                    />
                                    <BaseShiftTypeDialogScoreInput
                                        setFieldValue={setFieldValue}
                                        values={values}
                                    />
                                    <TextField
                                        label="הקצאות ליום"
                                        type="number"
                                        onChange={(e) => setFieldValue('dailySlots', e.target.value)}
                                        value={values.dailySlots}
                                    />
                                    <SelectField
                                        label="אוכלוסייה"
                                        onChange={(e) => setFieldValue('populationType', e.target.value)}
                                        defaultValue={values.populationType}
                                    >
                                        {
                                            populationTypes.map((populationType) => (
                                                <MenuItem 
                                                    key={populationType} 
                                                    value={populationType}>
                                                    {populationType}
                                                </MenuItem>
                                            ))
                                        }
                                    </SelectField>
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
