import BaseGuardDialog from './BaseGuardDialog';
import { putGuard } from '../Shared/Calls';
import { useAppContext } from '../Shared/AppContext';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';

export default function EditGuardDialog({ isDialogOpen, setIsDialogOpen, activeGuard }) {
    const { setGuards } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const editGuard = (values) => {
        const updatedGuard = {
            ...activeGuard,
            name: values.name,
            username: values.username,
            branch: values.branch,
            // TODO: Update Population types in dialogs correctly
            //population_types: values.populationType,
        };

        putGuard(updatedGuard)
            .then((response) => {
                setGuards((prevGuards) => {
                    const newGuards = [...prevGuards];
                    newGuards[prevGuards.indexOf(activeGuard)] = response.data;

                    return newGuards;
                })

                showSuccessSnackbar('edit-guard-success', 'עריכת משתמש הצליחה')
            })
            .catch(() => {
                showErrorSnackbar('edit-guard-failed', 'עריכת משתמש נכשלה')
            });
    };

    const dialogTitle = `עריכת משתמש - ${activeGuard?.name}`;

    const initialValues = {
        name: activeGuard?.name,
        username: activeGuard?.username,
        branch: activeGuard?.branch || '',
        // TODO: Show all population types and don't assume there's only one
        populationType: activeGuard?.population_types[0],
    };

    return (
        <BaseGuardDialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            dialogTitle={dialogTitle}
            makeGuardAction={editGuard}
            formInitialValues={initialValues}
            disablePopulationFields={true}
        />
    );
}
