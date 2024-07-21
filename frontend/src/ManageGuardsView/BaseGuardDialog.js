import { Dialog, DialogTitle, DialogContent, Button, MenuItem } from '@mui/material';
import { useAppContext } from '../Shared/AppContext';
import CloseButton from '../Shared/CloseButton';
import SelectField from '../Shared/FormFields/SelectField';
import TextField from '../Shared/FormFields/TextField';
import { FlexForm, CenterContainer } from '../Shared/Containers';
import { Formik } from 'formik';

export default function BaseGuardDialog({
    isDialogOpen,
    setIsDialogOpen,
    dialogTitle,
    makeGuardAction,
    formInitialValues,
    disablePopulationFields,
}) {
    const { populationTypes, managedBranches } = useAppContext();

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const handleSubmit = (values) => {
        setIsDialogOpen(false);
        makeGuardAction(values);
    };

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {dialogTitle}
                <CloseButton onClick={handleClose} />
            </DialogTitle>

            <DialogContent>
                <CenterContainer>
                    <Formik initialValues={formInitialValues} onSubmit={handleSubmit}>
                        {({ submitForm, setFieldValue, values }) => (
                            <FlexForm>
                                <TextField
                                    label="שם"
                                    defaultValue={values.name}
                                    onChange={(e) => setFieldValue('name', e.target.value)}
                                />

                                <TextField
                                    label="שם משתמש"
                                    defaultValue={values.username}
                                    onChange={(e) => setFieldValue('username', e.target.value)}
                                />

                                <SelectField
                                    label="קבוצה"
                                    disabled={disablePopulationFields}
                                    defaultValue={values.branch}
                                    onChange={(e) => setFieldValue('branch', e.target.value)}
                                >
                                    {managedBranches.map((branch, index) => (
                                        <MenuItem key={index} value={branch._id}>
                                            {branch.name}
                                        </MenuItem>
                                    ))}
                                </SelectField>

                                <SelectField
                                    label="אוכלוסייה"
                                    defaultValue={values.populationType}
                                    onChange={(e) => setFieldValue('populationType', e.target.value)}
                                >
                                    {populationTypes.map((populationType, index) => (
                                        <MenuItem key={index} value={populationType}>
                                            {populationType}
                                        </MenuItem>
                                    ))}
                                </SelectField>

                                <Button color="primary" variant="contained" onClick={submitForm}>
                                    שמור
                                </Button>
                            </FlexForm>
                        )}
                    </Formik>
                </CenterContainer>
            </DialogContent>
        </Dialog>
    );
}
