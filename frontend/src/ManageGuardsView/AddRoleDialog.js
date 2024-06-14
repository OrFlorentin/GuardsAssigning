import { Button, Dialog, DialogContent, DialogTitle, MenuItem } from "@mui/material";
import { Formik } from "formik";
import { useAppContext } from "../Shared/AppContext";
import { addUserRole } from "../Shared/Calls";
import CloseButton from "../Shared/CloseButton";
import { CenterContainer, FlexForm } from "../Shared/Containers";
import SelectField from "../Shared/FormFields/SelectField";
import { useCustomSnackbar } from "../Shared/SnackbarUtils";
import AddRoleExtraParameters from "./AddRoleExtraParameters";


export default function AddRoleDialog({
    isDialogOpen,
    setIsDialogOpen,
    activeGuard
}) {
    const { setGuards, userRoles } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();
    
    const handleClose = () => {
        setIsDialogOpen(false);
    };

    const handleSubmit = (values) => {
        const userRole = {role: values.role, extra_parameters: values.extra_parameters};
        addUserRole(activeGuard?._id, userRole).then((response) => {
            setGuards((prevGuards) => {
                const newGuards = [...prevGuards];
                newGuards[prevGuards.indexOf(activeGuard)] = response.data;

                return newGuards;
            });

            showSuccessSnackbar("add-role-success", "הוספת תפקיד הצליחה");
            handleClose();
        }).catch((e) => {
            console.error(e);
            showErrorSnackbar("add-role-failed", "Failed to add role");
        });
    };

    const title = "הוספת תפקיד";

    const values = {};

    return (
        <Dialog open={isDialogOpen} onClose={handleClose} maxWidth="sm" dir="rtl" fullWidth>
            <DialogTitle>
                {title}
                <CloseButton onClick={handleClose} />
            </DialogTitle>
            <DialogContent>
                <CenterContainer>
                    <Formik initialValues={values} onSubmit={handleSubmit}>
                        {({ submitForm, setFieldValue, values }) => (
                            <FlexForm>
                                <SelectField
                                    label="שם התפקיד"
                                    onChange={(e) => setFieldValue('role', e.target.value)}
                                >
                                    {userRoles.map((userRole, index) => (
                                        <MenuItem key={index} value={userRole}>
                                            {userRole}
                                        </MenuItem>
                                    ))}
                                </SelectField>
                                <AddRoleExtraParameters
                                    role={values.role}
                                    setFieldValue={setFieldValue}
                                    activeGuard={activeGuard}
                                />
                                 <Button color="primary" variant="contained" onClick={submitForm}>
                                    הוסף
                                </Button>
                            </FlexForm>
                        )}
                    </Formik>
                </CenterContainer>
            </DialogContent>
        </Dialog>
    );
}
