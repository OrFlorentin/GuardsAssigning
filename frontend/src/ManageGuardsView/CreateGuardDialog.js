import BaseGuardDialog from './BaseGuardDialog';
import { putGuard } from '../Shared/Calls';
import { useAppContext } from '../Shared/AppContext';
import { getScoreSchema, getEmptyValue } from '../Shared/Utils';
import { useCustomSnackbar } from '../Shared/SnackbarUtils';
import moment from 'moment';

export default function CreateGuardDialog({
    isDialogOpen,
    setIsDialogOpen,
}) {
    const { filteredBranch, filteredPopulationType, setGuards, branches, scoreSchemas } = useAppContext();
    const { showSuccessSnackbar, showErrorSnackbar } = useCustomSnackbar();

    const getEmptyExtraParams = (values) => {
        const scoreSchema = getScoreSchema(values.branch, values.populationType, branches, scoreSchemas);

        const extraParams = {};

        scoreSchema &&
            scoreSchema.forEach((column) => {
                extraParams[column.column_id] = getEmptyValue(column.type);
            });

        return extraParams;
    };

    const createDefaultPopulationSettings = (values) => {
        // Todo: Change this whenever chnaging popuation settings sturcture
        return [
            {
                population_type: values?.populationType,
                restrictions: [],
                score_multiplier: 1,
                join_date: moment(),
                initial_score: { regular_score: 0.0, weekend_score: 0.0 },
                score: { regular_score: 0.0, weekend_score: 0.0 },
                extra_params: getEmptyExtraParams(values),
            }
        ];
    }

    const createGuard = (values) => {
        const populationTypes = (values.populationType) ? [values.populationType] : [];

        const newGuard = {
            name: values.name,
            username: values.username,
            roles: [],
            branch: values.branch,
            // TODO: Allow creating users with multiple populations
            population_settings: createDefaultPopulationSettings(values),
            population_types: populationTypes,
            permissions: [],
        };

        putGuard(newGuard)
            .then((response) => {
                setGuards((prevGuards) => {
                    const newGuards = [...prevGuards];
                    newGuards.push(response.data);

                    return newGuards;
                })

                showSuccessSnackbar('create-user-success', 'יצירת משתמש הצליחה')
            })
            .catch(() => {
                showErrorSnackbar('create-user-failed', 'יצירת משתמש נכשלה')
            });
    };

    const initialValues = {
        branch: filteredBranch,
        populationType: filteredPopulationType
    };

    return (
        <BaseGuardDialog
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            dialogTitle="יצירת משתמש"
            makeGuardAction={createGuard}
            formInitialValues={initialValues}
            disablePopulationFields={false}
        />
    );
}
